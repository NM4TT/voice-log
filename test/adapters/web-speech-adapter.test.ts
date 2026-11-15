import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSpeechAdapter } from '@/adapters/transcription/web-speech-adapter';

class MockSpeechRecognition {
  static latestInstance: MockSpeechRecognition | null = null;
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { readonly error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  startCount = 0;
  stopCalled = false;

  constructor() {
    MockSpeechRecognition.latestInstance = this;
  }

  start(): void {
    this.startCount += 1;
  }

  stop(): void {
    this.stopCalled = true;
    if (this.onend) {
      this.onend();
    }
  }
}

describe('adapters/transcription/web-speech-adapter', () => {
  beforeEach(() => {
    MockSpeechRecognition.latestInstance = null;
    vi.stubGlobal('window', {
      SpeechRecognition: MockSpeechRecognition,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stops infinite restart loop when fatal recognition error occurs', async () => {
    const adapter = new WebSpeechAdapter();
    const errors: string[] = [];

    await adapter.startLiveCapture(
      'es',
      () => {},
      (msg) => errors.push(msg)
    );

    const instance = MockSpeechRecognition.latestInstance!;
    expect(instance.startCount).toBe(1);

    instance.onerror?.({ error: 'network' });
    instance.onend?.();

    expect(errors).toEqual(['network']);
    expect(instance.startCount).toBe(1);
  });

  it('captures late final result emitted during stopLiveCapture before onend', async () => {
    class DelayedStopRecognition extends MockSpeechRecognition {
      override stop(): void {
        this.stopCalled = true;
        this.onresult?.({
          resultIndex: 0,
          results: {
            length: 1,
            0: { isFinal: true, 0: { transcript: 'nota dictada al cerrar' } },
          },
        });
        this.onend?.();
      }
    }

    vi.stubGlobal('window', {
      SpeechRecognition: DelayedStopRecognition,
    });

    const adapter = new WebSpeechAdapter();
    await adapter.startLiveCapture('es', () => {}, () => {});

    const finalTranscript = await adapter.stopLiveCapture();
    expect(finalTranscript).toBe('nota dictada al cerrar');
  });

  it('preserves pending interim text when recognition cycle restarts on onend', async () => {
    const adapter = new WebSpeechAdapter();
    await adapter.startLiveCapture('es', () => {}, () => {});

    const instance = MockSpeechRecognition.latestInstance!;
    instance.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: { isFinal: false, 0: { transcript: 'revisando la arquitectura' } },
      },
    });

    instance.onend?.();

    instance.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: { isFinal: true, 0: { transcript: 'del servidor principal' } },
      },
    });

    const fullText = await adapter.stopLiveCapture();
    expect(fullText).toBe('revisando la arquitectura del servidor principal');
  });
});
