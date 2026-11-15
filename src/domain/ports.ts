import type {
  LogbookEntry,
  LogbookMode,
  SupportedLocale,
  TranscriptionEngineId,
} from '@/domain/types';

export interface TranscriptionSegmentCallback {
  (text: string, isFinal: boolean): void;
}

export interface ITranscriptionEngine {
  readonly engineId: TranscriptionEngineId;
  isSupported(): boolean;
  startLiveCapture(
    locale: SupportedLocale,
    onSegment: TranscriptionSegmentCallback,
    onError: (message: string) => void
  ): Promise<void>;
  stopLiveCapture(): Promise<string>;
  transcribeAudioBuffer?(
    pcmSamples: Float32Array,
    sampleRate: number,
    locale: SupportedLocale
  ): Promise<string>;
}

export interface AudioRecordingResult {
  readonly pcmSamples: Float32Array;
  readonly wavBlob: Blob;
  readonly durationMs: number;
}

export interface IAudioRecorder {
  start(onWaveformUpdate: (bars: readonly number[], rms: number) => void): Promise<void>;
  stop(): Promise<AudioRecordingResult>;
  cancel(): void;
}

export interface IEphemeralSessionStore {
  saveEntry(entry: LogbookEntry, audioBlob?: Blob): Promise<void>;
  getEntries(): Promise<readonly LogbookEntry[]>;
  getAudioBlob(entryId: string): Promise<Blob | null>;
  deleteEntry(entryId: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface AiStructureResult {
  readonly markdown: string;
  readonly suggestedTitle?: string;
  readonly extractedTags?: readonly string[];
}

export interface IAiStructurer {
  isConfigured(): boolean;
  structureLogbook(
    entries: readonly LogbookEntry[],
    mode: LogbookMode,
    locale: SupportedLocale
  ): Promise<AiStructureResult>;
}
