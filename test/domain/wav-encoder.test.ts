import { describe, it, expect } from 'vitest';
import {
  encodePcmToWavBuffer,
  normalizePcmSpeechLevel,
  resamplePcmToTargetRate,
} from '@/domain/audio/wav-encoder';

describe('domain/audio/wav-encoder', () => {
  it('encodes Float32Array PCM samples into a valid 44-byte RIFF WAVE header + 16-bit payload', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1.0, -1.0]);
    const buffer = encodePcmToWavBuffer(samples, 16000);
    const view = new DataView(buffer);

    expect(buffer.byteLength).toBe(44 + samples.length * 2);
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
    expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe('WAVE');
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBeGreaterThan(16000);
    expect(view.getInt16(48, true)).toBeLessThan(-16000);
  });

  it('resamples 48kHz PCM samples down to 16kHz deterministically', () => {
    const input48k = new Float32Array(480).fill(0.4);
    const output16k = resamplePcmToTargetRate(input48k, 48000, 16000);

    expect(output16k.length).toBe(160);
    expect(output16k[0]).toBeCloseTo(0.4, 4);
    expect(output16k[159]).toBeCloseTo(0.4, 4);
  });

  it('returns identical samples when source and target sample rates match', () => {
    const input = new Float32Array([0.1, -0.2, 0.3]);
    const output = resamplePcmToTargetRate(input, 16000, 16000);

    expect(output.length).toBe(3);
    expect(output[1]).toBeCloseTo(-0.2, 4);
  });

  it('averages window samples during downsampling to prevent high-frequency aliasing', () => {
    const input48k = new Float32Array([0.9, 0.3, 0.0, -0.9, -0.3, 0.0]);
    const output16k = resamplePcmToTargetRate(input48k, 48000, 16000);

    expect(output16k.length).toBe(2);
    expect(output16k[0]).toBeCloseTo(0.4, 4);
    expect(output16k[1]).toBeCloseTo(-0.4, 4);
  });

  it('normalizes quiet speech PCM samples to target peak while removing DC offset', () => {
    const quietSpeech = new Float32Array([0.1, -0.1, 0.05, -0.05]);
    const normalized = normalizePcmSpeechLevel(quietSpeech);

    expect(Math.abs(normalized[0] ?? 0)).toBeCloseTo(0.89, 2);
    expect(Math.abs(normalized[1] ?? 0)).toBeCloseTo(0.89, 2);
  });
});
