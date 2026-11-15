import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaStreamRecorder } from '@/adapters/audio/media-stream-recorder';

describe('adapters/audio/media-stream-recorder', () => {
  let resumeSpy = vi.fn().mockResolvedValue(undefined);
  let gainValue = 1;
  let audioProcessCallback: ((event: { inputBuffer: { getChannelData: () => Float32Array } }) => void) | null = null;

  beforeEach(() => {
    resumeSpy = vi.fn().mockResolvedValue(undefined);
    gainValue = 1;
    audioProcessCallback = null;

    class MockAudioContext {
      sampleRate = 48000;
      state = 'suspended';
      destination = {};

      resume = resumeSpy;
      close = vi.fn().mockResolvedValue(undefined);

      createMediaStreamSource() {
        return {
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }

      createGain() {
        const gainParam = {
          get value() {
            return gainValue;
          },
          set value(v: number) {
            gainValue = v;
          },
        };
        return {
          gain: gainParam,
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }

      createScriptProcessor() {
        const node = {
          onaudioprocess: null as ((event: { inputBuffer: { getChannelData: () => Float32Array } }) => void) | null,
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
        return new Proxy(node, {
          set(target, prop, value) {
            if (prop === 'onaudioprocess') {
              audioProcessCallback = value;
            }
            Reflect.set(target, prop, value);
            return true;
          },
        });
      }
    }

    vi.stubGlobal('window', {
      AudioContext: MockAudioContext,
    });
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resumes suspended AudioContext, mutes monitor gain, and resamples 48kHz audio to 16kHz on stop', async () => {
    const recorder = new MediaStreamRecorder();
    await recorder.start(() => {});

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(gainValue).toBe(0);

    const rawFrame = new Float32Array(480);
    for (let i = 0; i < rawFrame.length; i += 1) {
      rawFrame[i] = i < 240 ? 0.25 : -0.25;
    }

    audioProcessCallback?.({
      inputBuffer: {
        getChannelData: () => rawFrame,
      },
    });

    const result = await recorder.stop();
    expect(result.pcmSamples.length).toBe(160);
    expect(result.pcmSamples[0]).toBeCloseTo(0.89, 2);
  });
});
