import {
  VAD_PARAGRAPH_PAUSE_MS,
  VAD_RMS_SILENCE_THRESHOLD,
  WAVEFORM_BAR_COUNT,
} from '@/config/constants';
import type { VadAnalysisResult } from '@/domain/types';

const PEAK_NORMALIZATION_GAIN = 3.2;
const MIN_BAR_HEIGHT = 0.06;
const MAX_BAR_HEIGHT = 1.0;

export function computeRmsEnergy(samples: Float32Array): number {
  let sumSquares = 0;
  let i = 0;
  let sample = 0;

  if (samples.length === 0) {
    return 0;
  }

  for (i = 0; i < samples.length; i += 1) {
    sample = samples[i] ?? 0;
    sumSquares += sample * sample;
  }

  return Math.sqrt(sumSquares / samples.length);
}

export function extractWaveformBars(
  samples: Float32Array,
  barCount: number = WAVEFORM_BAR_COUNT
): readonly number[] {
  const safeCount = Math.max(1, barCount);
  const bars: number[] = [];
  const step = Math.max(1, Math.floor(samples.length / safeCount));
  let b = 0;
  let start = 0;
  let end = 0;
  let i = 0;
  let localPeak = 0;
  let absVal = 0;
  let scaled = 0;

  if (samples.length === 0) {
    return new Array<number>(safeCount).fill(MIN_BAR_HEIGHT);
  }

  for (b = 0; b < safeCount; b += 1) {
    start = b * step;
    end = Math.min(samples.length, start + step);
    localPeak = 0;
    for (i = start; i < end; i += 1) {
      absVal = Math.abs(samples[i] ?? 0);
      if (absVal > localPeak) {
        localPeak = absVal;
      }
    }
    scaled = Math.min(MAX_BAR_HEIGHT, Math.max(MIN_BAR_HEIGHT, localPeak * PEAK_NORMALIZATION_GAIN));
    bars.push(Number(scaled.toFixed(3)));
  }

  return Object.freeze(bars);
}

export function analyzeAudioFrame(
  samples: Float32Array,
  barCount: number = WAVEFORM_BAR_COUNT,
  silenceThreshold: number = VAD_RMS_SILENCE_THRESHOLD
): VadAnalysisResult {
  const rms = computeRmsEnergy(samples);
  const isSpeaking = rms >= silenceThreshold;
  const waveformBars = extractWaveformBars(samples, barCount);
  const normalizedPeak = Math.min(MAX_BAR_HEIGHT, rms * PEAK_NORMALIZATION_GAIN);

  return Object.freeze({
    rms,
    isSpeaking,
    normalizedPeak,
    waveformBars,
  });
}

export function shouldTriggerPauseBreak(
  silenceDurationMs: number,
  hadPriorSpeech: boolean,
  pauseThresholdMs: number = VAD_PARAGRAPH_PAUSE_MS
): boolean {
  if (!hadPriorSpeech) {
    return false;
  }
  return silenceDurationMs >= pauseThresholdMs;
}
