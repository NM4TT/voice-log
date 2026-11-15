import { describe, it, expect } from 'vitest';
import {
  computeRmsEnergy,
  analyzeAudioFrame,
  shouldTriggerPauseBreak,
} from '@/domain/audio/vad-detector';

describe('domain/audio/vad-detector', () => {
  it('computes zero RMS for empty or silent buffers', () => {
    expect(computeRmsEnergy(new Float32Array(0))).toBe(0);
    expect(computeRmsEnergy(new Float32Array([0, 0, 0, 0]))).toBe(0);
  });

  it('computes accurate RMS energy for known signal', () => {
    const samples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
    expect(computeRmsEnergy(samples)).toBeCloseTo(0.5, 4);
  });

  it('detects active speech vs silence and generates normalized waveform bars', () => {
    const silentFrame = new Float32Array(128).fill(0.002);
    const activeFrame = new Float32Array(128).fill(0.25);

    const silentResult = analyzeAudioFrame(silentFrame, 8);
    expect(silentResult.isSpeaking).toBe(false);
    expect(silentResult.waveformBars).toHaveLength(8);

    const activeResult = analyzeAudioFrame(activeFrame, 8);
    expect(activeResult.isSpeaking).toBe(true);
    expect(activeResult.normalizedPeak).toBeGreaterThan(0.2);
    expect(activeResult.waveformBars.every((bar) => bar >= 0 && bar <= 1)).toBe(true);
  });

  it('triggers paragraph pause break when silence exceeds threshold after speech', () => {
    expect(shouldTriggerPauseBreak(1800, true, 1600)).toBe(true);
    expect(shouldTriggerPauseBreak(900, true, 1600)).toBe(false);
    expect(shouldTriggerPauseBreak(2000, false, 1600)).toBe(false);
  });
});
