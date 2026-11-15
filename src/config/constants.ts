import type { LogbookMode, TranscriptionEngineId, SupportedLocale } from '@/domain/types';

export const APP_NAME = 'VoiceLog';
export const DEFAULT_LOCALE: SupportedLocale = 'es';
export const DEFAULT_LOGBOOK_MODE: LogbookMode = 'CHRONO_LOG';
export const DEFAULT_TRANSCRIPTION_ENGINE: TranscriptionEngineId = 'HYBRID_WEB_SPEECH';
export const WHISPER_MODEL_ID = 'Xenova/whisper-base';

export const AUDIO_SAMPLE_RATE = 16000;
export const AUDIO_CHANNELS = 1;
export const AUDIO_BITS_PER_SAMPLE = 16;
export const VAD_RMS_SILENCE_THRESHOLD = 0.015;
export const VAD_PARAGRAPH_PAUSE_MS = 1600;
export const WAVEFORM_BAR_COUNT = 28;
export const MAX_RECORDING_SECONDS = 300;
export const MAX_RECORDING_SAMPLES = AUDIO_SAMPLE_RATE * MAX_RECORDING_SECONDS;
export const MAX_LOGBOOK_ENTRIES = 50;

export const MAX_FILENAME_LENGTH = 100;
export const MAX_EXTENSION_LENGTH = 16;
export const MAX_SAFE_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_SAFE_TEXT_LENGTH = 100000;
export const DEFAULT_MARKDOWN_FILENAME = 'bitacora.md';
export const DEFAULT_AUDIO_FILENAME = 'grabacion.wav';

export const STORAGE_KEYS = {
  LOCALE: 'voice_log_locale',
  ENGINE_PREFERENCE: 'voice_log_engine',
  INCLUDE_FRONTMATTER: 'voice_log_frontmatter',
  CLEAN_FILLERS: 'voice_log_clean_fillers',
} as const;

export const IDB_CONFIG = {
  DB_NAME: 'voice_log_ephemeral_db',
  DB_VERSION: 1,
  ENTRIES_STORE: 'session_entries',
  AUDIO_STORE: 'entry_audio_blobs',
} as const;
