import type {
  ITranscriptionEngine,
  TranscriptionSegmentCallback,
} from '@/domain/ports';
import type { SupportedLocale, TranscriptionEngineId } from '@/domain/types';

const STOP_FLUSH_TIMEOUT_MS = 250;
const LOCALE_TAG_ES = 'es-ES';
const LOCALE_TAG_EN = 'en-US';
const UNSUPPORTED_ERROR_CODE = 'speech-recognition-unsupported';

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function resolveSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  const ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  return typeof ctor === 'function' ? (ctor as SpeechRecognitionConstructor) : null;
}

function resolveRecognitionLang(locale: SupportedLocale): string {
  const navLang =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : '';
  if (locale === 'es') {
    return navLang.toLowerCase().startsWith('es') ? navLang : LOCALE_TAG_ES;
  }
  return navLang.toLowerCase().startsWith('en') ? navLang : LOCALE_TAG_EN;
}

export class WebSpeechAdapter implements ITranscriptionEngine {
  readonly engineId: TranscriptionEngineId = 'HYBRID_WEB_SPEECH';
  private recognition: SpeechRecognitionInstance | null = null;
  private isCapturing = false;
  private persistedText = '';
  private cycleFinalText = '';
  private interimText = '';

  isSupported(): boolean {
    return resolveSpeechRecognitionCtor() !== null;
  }

  async startLiveCapture(
    locale: SupportedLocale,
    onSegment: TranscriptionSegmentCallback,
    onError: (message: string) => void
  ): Promise<void> {
    const Ctor = resolveSpeechRecognitionCtor();
    this.persistedText = '';
    this.cycleFinalText = '';
    this.interimText = '';

    if (!Ctor) {
      onError(UNSUPPORTED_ERROR_CODE);
      return;
    }

    this.isCapturing = true;
    this.recognition = new Ctor();
    this.recognition.lang = resolveRecognitionLang(locale);
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.bindRecognitionEvents(onSegment, onError);

    try {
      this.recognition.start();
    } catch (err) {
      this.isCapturing = false;
      onError(err instanceof Error ? err.message : 'speech-start-failed');
    }
  }

  private bindRecognitionEvents(
    onSegment: TranscriptionSegmentCallback,
    onError: (message: string) => void
  ): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
      this.handleRecognitionResult(event, onSegment);
    };

    this.recognition.onerror = (event: { readonly error: string }) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      this.isCapturing = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.commitCycleText();
      if (this.isCapturing && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          this.isCapturing = false;
        }
      }
    };
  }

  private commitCycleText(): void {
    const cycleCombined = [this.cycleFinalText.trim(), this.interimText.trim()]
      .filter((part) => part.length > 0)
      .join(' ')
      .trim();

    if (cycleCombined.length > 0) {
      this.persistedText = [this.persistedText, cycleCombined]
        .filter((part) => part.length > 0)
        .join(' ');
      this.cycleFinalText = '';
      this.interimText = '';
    }
  }

  private getCombinedTranscript(): string {
    return [this.persistedText, this.cycleFinalText.trim(), this.interimText.trim()]
      .filter((part) => part.length > 0)
      .join(' ')
      .trim();
  }

  private handleRecognitionResult(
    event: SpeechRecognitionEventLike,
    onSegment: TranscriptionSegmentCallback
  ): void {
    let currentFinal = '';
    let currentInterim = '';
    let i = 0;
    let res: SpeechRecognitionResultLike | undefined;
    let combined: string;

    for (i = 0; i < event.results.length; i += 1) {
      res = event.results[i];
      if (res && res[0]) {
        if (res.isFinal) {
          currentFinal += `${res[0].transcript.trim()} `;
        } else {
          currentInterim += res[0].transcript;
        }
      }
    }

    this.cycleFinalText = currentFinal.trim();
    this.interimText = currentInterim.trim();
    combined = this.getCombinedTranscript();
    onSegment(combined, this.interimText.length === 0);
  }

  async stopLiveCapture(): Promise<string> {
    const activeRecognition = this.recognition;
    this.isCapturing = false;
    this.recognition = null;

    if (!activeRecognition) {
      return this.getCombinedTranscript();
    }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        activeRecognition.onend = null;
        resolve();
      }, STOP_FLUSH_TIMEOUT_MS);

      activeRecognition.onend = () => {
        clearTimeout(timer);
        this.commitCycleText();
        resolve();
      };

      try {
        activeRecognition.stop();
      } catch {
        clearTimeout(timer);
        resolve();
      }
    });

    return this.getCombinedTranscript();
  }
}
