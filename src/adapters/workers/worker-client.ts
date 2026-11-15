import { parseSpokenMarkdownSegments } from '@/domain/markdown/spoken-commands';
import type { ParsedVoiceSegment, SupportedLocale } from '@/domain/types';
import type {
  WhisperModelStatus,
  WorkerOutgoingMessage,
  WorkerPreloadRequest,
  WorkerProcessRequest,
} from '@/adapters/workers/audio-processor.worker';

export interface AudioWorkerResult {
  readonly segments: readonly ParsedVoiceSegment[];
  readonly resolvedTranscript: string;
  readonly usedWhisper: boolean;
}

export interface WhisperModelProgressState {
  readonly status: WhisperModelStatus;
  readonly progress: number;
  readonly file: string;
  readonly errorMessage?: string;
}

export class AudioProcessorWorkerClient {
  private worker: Worker | null = null;
  private progressListener: ((state: WhisperModelProgressState) => void) | null = null;

  setProgressListener(
    listener: ((state: WhisperModelProgressState) => void) | null
  ): void {
    this.progressListener = listener;
  }

  private getOrCreateWorker(): Worker | null {
    if (typeof Worker === 'undefined') {
      return null;
    }
    if (!this.worker) {
      this.worker = new Worker(
        new URL('./audio-processor.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.addEventListener('message', (event: MessageEvent<WorkerOutgoingMessage>) => {
        if (event.data.kind === 'MODEL_PROGRESS' && this.progressListener) {
          this.progressListener({
            status: event.data.status,
            progress: event.data.progress,
            file: event.data.file,
            ...(event.data.errorMessage !== undefined
              ? { errorMessage: event.data.errorMessage }
              : {}),
          });
        }
      });
    }
    return this.worker;
  }

  async preloadWhisperModel(): Promise<boolean> {
    const worker = this.getOrCreateWorker();
    const requestId = `preload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (!worker) {
      return false;
    }

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
        if (event.data.kind !== 'PRELOAD_DONE' || event.data.requestId !== requestId) {
          return;
        }
        worker.removeEventListener('message', handleMessage);
        resolve(event.data.ready);
      };

      const request: WorkerPreloadRequest = {
        kind: 'PRELOAD_MODEL',
        requestId,
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage(request);
    });
  }

  async processRecording(
    pcmSamples: Float32Array,
    rawTranscript: string,
    locale: SupportedLocale,
    useWhisperOffline: boolean,
    cleanFillers: boolean = true
  ): Promise<AudioWorkerResult> {
    const worker = this.getOrCreateWorker();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const transferableCopy = new Float32Array(pcmSamples.length);

    if (!worker) {
      return {
        segments: parseSpokenMarkdownSegments(rawTranscript, locale, cleanFillers),
        resolvedTranscript: rawTranscript,
        usedWhisper: false,
      };
    }

    transferableCopy.set(pcmSamples);

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
        if (event.data.kind !== 'PROCESS_RESULT' || event.data.requestId !== requestId) {
          return;
        }
        worker.removeEventListener('message', handleMessage);
        resolve({
          segments: event.data.segments,
          resolvedTranscript: event.data.resolvedTranscript,
          usedWhisper: event.data.usedWhisper,
        });
      };

      const request: WorkerProcessRequest = {
        kind: 'PROCESS_AUDIO',
        requestId,
        pcmBuffer: transferableCopy.buffer,
        rawTranscript,
        locale,
        useWhisperOffline,
        cleanFillers,
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage(request, [transferableCopy.buffer]);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
