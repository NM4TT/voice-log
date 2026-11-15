import {
  env,
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
  type ProgressInfo,
} from '@huggingface/transformers';
import {
  AUDIO_SAMPLE_RATE,
  MAX_RECORDING_SAMPLES,
  VAD_RMS_SILENCE_THRESHOLD,
  WHISPER_MODEL_ID,
} from '@/config/constants';
import { computeRmsEnergy } from '@/domain/audio/vad-detector';
import { normalizePcmSpeechLevel } from '@/domain/audio/wav-encoder';
import { parseSpokenMarkdownSegments } from '@/domain/markdown/spoken-commands';
import {
  assertNever,
  type ParsedVoiceSegment,
  type SupportedLocale,
} from '@/domain/types';

export type WhisperModelStatus = 'IDLE' | 'DOWNLOADING' | 'READY' | 'ERROR';

export interface WorkerPreloadRequest {
  readonly kind: 'PRELOAD_MODEL';
  readonly requestId: string;
}

export interface WorkerProcessRequest {
  readonly kind: 'PROCESS_AUDIO';
  readonly requestId: string;
  readonly pcmBuffer: ArrayBuffer;
  readonly rawTranscript: string;
  readonly locale: SupportedLocale;
  readonly useWhisperOffline: boolean;
  readonly cleanFillers: boolean;
}

export type WorkerIncomingMessage = WorkerPreloadRequest | WorkerProcessRequest;

export interface WorkerModelProgressMessage {
  readonly kind: 'MODEL_PROGRESS';
  readonly status: WhisperModelStatus;
  readonly progress: number;
  readonly file: string;
  readonly errorMessage?: string;
}

export interface WorkerPreloadDoneMessage {
  readonly kind: 'PRELOAD_DONE';
  readonly requestId: string;
  readonly ready: boolean;
  readonly errorMessage?: string;
}

export interface WorkerProcessResponse {
  readonly kind: 'PROCESS_RESULT';
  readonly requestId: string;
  readonly segments: readonly ParsedVoiceSegment[];
  readonly resolvedTranscript: string;
  readonly usedWhisper: boolean;
}

export type WorkerOutgoingMessage =
  | WorkerModelProgressMessage
  | WorkerPreloadDoneMessage
  | WorkerProcessResponse;

const FRAME_SAMPLES = Math.floor(AUDIO_SAMPLE_RATE * 0.2);
const WHISPER_CHUNK_SECONDS = 30;
const WHISPER_STRIDE_SECONDS = 5;

env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
  delete (env.backends.onnx.wasm as { wasmPaths?: unknown }).wasmPaths;
}

let whisperPipelinePromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

export function resetWhisperPipelineForTests(): void {
  whisperPipelinePromise = null;
}

function analyzeAcousticSpeechWindows(pcmSamples: Float32Array): number {
  const boundedLen = Math.min(pcmSamples.length, MAX_RECORDING_SAMPLES);
  let activeWindows = 0;
  let offset = 0;
  let slice: Float32Array;

  for (offset = 0; offset + FRAME_SAMPLES <= boundedLen; offset += FRAME_SAMPLES) {
    slice = pcmSamples.subarray(offset, offset + FRAME_SAMPLES);
    if (computeRmsEnergy(slice) >= VAD_RMS_SILENCE_THRESHOLD) {
      activeWindows += 1;
    }
  }
  return activeWindows;
}

function emitProgressFromCallback(
  info: ProgressInfo,
  emit: (msg: WorkerOutgoingMessage) => void
): void {
  const status = info.status;
  switch (status) {
    case 'initiate':
    case 'download':
      emit({
        kind: 'MODEL_PROGRESS',
        status: 'DOWNLOADING',
        progress: 0,
        file: info.file,
      });
      break;
    case 'progress':
      emit({
        kind: 'MODEL_PROGRESS',
        status: 'DOWNLOADING',
        progress: Math.min(99, Math.max(1, Math.round(info.progress))),
        file: info.file,
      });
      break;
    case 'progress_total':
      emit({
        kind: 'MODEL_PROGRESS',
        status: 'DOWNLOADING',
        progress: Math.min(99, Math.max(1, Math.round(info.progress))),
        file: info.name,
      });
      break;
    case 'done':
      break;
    case 'ready':
      emit({
        kind: 'MODEL_PROGRESS',
        status: 'READY',
        progress: 100,
        file: info.model,
      });
      break;
    default:
      assertNever(status);
  }
}

async function getOrLoadWhisperPipeline(
  emit: (msg: WorkerOutgoingMessage) => void
): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!whisperPipelinePromise) {
    emit({
      kind: 'MODEL_PROGRESS',
      status: 'DOWNLOADING',
      progress: 0,
      file: WHISPER_MODEL_ID,
    });
    whisperPipelinePromise = pipeline(
      'automatic-speech-recognition',
      WHISPER_MODEL_ID,
      {
        dtype: {
          encoder_model: 'fp32',
          decoder_model_merged: 'q8',
        },
        progress_callback: (info: ProgressInfo) => emitProgressFromCallback(info, emit),
      }
    );
  }

  try {
    const transcriber = await whisperPipelinePromise;
    emit({
      kind: 'MODEL_PROGRESS',
      status: 'READY',
      progress: 100,
      file: WHISPER_MODEL_ID,
    });
    return transcriber;
  } catch (err) {
    whisperPipelinePromise = null;
    emit({
      kind: 'MODEL_PROGRESS',
      status: 'ERROR',
      progress: 0,
      file: WHISPER_MODEL_ID,
      errorMessage: err instanceof Error ? err.message : 'Whisper load error',
    });
    throw err;
  }
}

async function transcribeWithWhisper(
  pcmSamples: Float32Array,
  locale: SupportedLocale,
  emit: (msg: WorkerOutgoingMessage) => void
): Promise<string> {
  const transcriber = await getOrLoadWhisperPipeline(emit);
  const normalizedAudio = normalizePcmSpeechLevel(pcmSamples);
  const language = locale === 'es' ? 'spanish' : 'english';
  const result = await transcriber(normalizedAudio, {
    language,
    task: 'transcribe',
    chunk_length_s: WHISPER_CHUNK_SECONDS,
    stride_length_s: WHISPER_STRIDE_SECONDS,
    temperature: 0,
    condition_on_previous_text: false,
  });

  if (Array.isArray(result)) {
    return result
      .map((item) => item.text)
      .join(' ')
      .trim();
  }
  return typeof result.text === 'string' ? result.text.trim() : '';
}

async function handleProcessAudioRequest(
  req: WorkerProcessRequest,
  emit: (msg: WorkerOutgoingMessage) => void
): Promise<void> {
  const pcmSamples = new Float32Array(req.pcmBuffer);
  const activeWindows = analyzeAcousticSpeechWindows(pcmSamples);
  const trimmedRaw = req.rawTranscript.trim();
  const shouldInvokeWhisper =
    activeWindows > 0 && (req.useWhisperOffline || trimmedRaw.length === 0);
  let resolvedTranscript = trimmedRaw;
  let usedWhisper = false;
  let whisperText = '';
  let segments: readonly ParsedVoiceSegment[];

  if (shouldInvokeWhisper) {
    try {
      whisperText = await transcribeWithWhisper(pcmSamples, req.locale, emit);
      if (whisperText.length > 0) {
        resolvedTranscript = whisperText;
        usedWhisper = true;
      }
    } catch {
      usedWhisper = false;
    }
  }

  segments = parseSpokenMarkdownSegments(
    resolvedTranscript,
    req.locale,
    req.cleanFillers
  );
  emit({
    kind: 'PROCESS_RESULT',
    requestId: req.requestId,
    segments,
    resolvedTranscript,
    usedWhisper,
  });
}

export async function handleWorkerMessage(
  data: WorkerIncomingMessage,
  emit: (msg: WorkerOutgoingMessage) => void
): Promise<void> {
  switch (data.kind) {
    case 'PRELOAD_MODEL':
      try {
        await getOrLoadWhisperPipeline(emit);
        emit({ kind: 'PRELOAD_DONE', requestId: data.requestId, ready: true });
      } catch (err) {
        emit({
          kind: 'PRELOAD_DONE',
          requestId: data.requestId,
          ready: false,
          errorMessage: err instanceof Error ? err.message : 'Whisper load error',
        });
      }
      break;
    case 'PROCESS_AUDIO':
      await handleProcessAudioRequest(data, emit);
      break;
    default:
      assertNever(data);
  }
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
    void handleWorkerMessage(event.data, (msg) => self.postMessage(msg));
  };
}
