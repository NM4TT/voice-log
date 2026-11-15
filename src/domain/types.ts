export type SupportedLocale = 'es' | 'en';

export type LogbookMode =
  | 'CHRONO_LOG'
  | 'QUICK_NOTE'
  | 'ACTION_ITEMS'
  | 'DAILY_STANDUP';

export type TranscriptionEngineId =
  | 'HYBRID_WEB_SPEECH'
  | 'WHISPER_WORKER'
  | 'MANUAL_ASSISTED';

export type EntryBlockKind =
  | 'PARAGRAPH'
  | 'HEADING'
  | 'TASK_ITEM'
  | 'CALLOUT_NOTE'
  | 'CALLOUT_IMPORTANT'
  | 'CODE_BLOCK';

export type ChronoSeverity = 'INFO' | 'FIX' | 'WARN';

export type StandupCategory = 'PROGRESS' | 'NEXT_STEPS' | 'BLOCKERS';

export interface LiveMarkerEvent {
  readonly id: string;
  readonly kind: EntryBlockKind;
  readonly offsetMs: number;
  readonly timestampIso: string;
}

export interface LogbookEntry {
  readonly id: string;
  readonly createdAtIso: string;
  readonly timestampLabel: string;
  readonly rawTranscript: string;
  readonly cleanedText: string;
  readonly kind: EntryBlockKind;
  readonly completed: boolean;
  readonly chronoSeverity: ChronoSeverity;
  readonly standupCategory: StandupCategory;
  readonly durationMs: number;
  readonly hasAudio: boolean;
  readonly tags: readonly string[];
}

export interface LogbookSession {
  readonly sessionId: string;
  readonly title: string;
  readonly mode: LogbookMode;
  readonly locale: SupportedLocale;
  readonly createdAtIso: string;
  readonly includeFrontmatter: boolean;
  readonly cleanFillers: boolean;
  readonly tags: readonly string[];
  readonly entries: readonly LogbookEntry[];
  readonly aiPolishedMarkdown: string | null;
}

export interface VadAnalysisResult {
  readonly rms: number;
  readonly isSpeaking: boolean;
  readonly normalizedPeak: number;
  readonly waveformBars: readonly number[];
}

export interface ParsedVoiceSegment {
  readonly kind: EntryBlockKind;
  readonly content: string;
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${String(value)}`);
}
