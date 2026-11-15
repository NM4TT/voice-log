import {
  AUDIO_BITS_PER_SAMPLE,
  AUDIO_CHANNELS,
  AUDIO_SAMPLE_RATE,
  MAX_RECORDING_SAMPLES,
} from '@/config/constants';

const WAV_HEADER_BYTES = 44;
const BYTES_PER_SAMPLE = AUDIO_BITS_PER_SAMPLE / 8;
const PCM_FORMAT_CODE = 1;
const FMT_CHUNK_SIZE = 16;
const INT16_MAX = 0x7fff;
const INT16_MIN = 0x8000;
const TARGET_SPEECH_PEAK = 0.89;
const MIN_NORMALIZABLE_PEAK = 0.008;
const MAX_NORMALIZATION_GAIN = 14.0;

function writeAsciiString(view: DataView, offset: number, text: string): void {
  let i = 0;
  for (i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function writeWavHeader(
  view: DataView,
  dataByteLength: number,
  sampleRate: number
): void {
  const byteRate = sampleRate * AUDIO_CHANNELS * BYTES_PER_SAMPLE;
  const blockAlign = AUDIO_CHANNELS * BYTES_PER_SAMPLE;

  writeAsciiString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeAsciiString(view, 8, 'WAVE');
  writeAsciiString(view, 12, 'fmt ');
  view.setUint32(16, FMT_CHUNK_SIZE, true);
  view.setUint16(20, PCM_FORMAT_CODE, true);
  view.setUint16(22, AUDIO_CHANNELS, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, AUDIO_BITS_PER_SAMPLE, true);
  writeAsciiString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);
}

export function resamplePcmToTargetRate(
  samples: Float32Array,
  sourceRate: number,
  targetRate: number = AUDIO_SAMPLE_RATE
): Float32Array {
  let ratio: number;
  let outputLength: number;
  let result: Float32Array;
  let i = 0;
  let startIdx = 0;
  let endIdx = 0;
  let j = 0;
  let sum = 0;
  let count = 0;

  if (samples.length === 0 || sourceRate <= 0 || targetRate <= 0 || sourceRate === targetRate) {
    return samples.slice(0, MAX_RECORDING_SAMPLES);
  }

  ratio = sourceRate / targetRate;
  outputLength = Math.min(MAX_RECORDING_SAMPLES, Math.max(1, Math.round(samples.length / ratio)));
  result = new Float32Array(outputLength);

  for (i = 0; i < outputLength; i += 1) {
    startIdx = Math.floor(i * ratio);
    endIdx = Math.min(samples.length, Math.max(startIdx + 1, Math.floor((i + 1) * ratio)));
    sum = 0;
    count = 0;
    for (j = startIdx; j < endIdx; j += 1) {
      sum += samples[j] ?? 0;
      count += 1;
    }
    result[i] = count > 0 ? sum / count : 0;
  }

  return result;
}

export function normalizePcmSpeechLevel(samples: Float32Array): Float32Array {
  const len = Math.min(samples.length, MAX_RECORDING_SAMPLES);
  const output = new Float32Array(len);
  let mean = 0;
  let peak = 0;
  let gain = 1;
  let i = 0;
  let centered = 0;

  if (len === 0) {
    return output;
  }

  for (i = 0; i < len; i += 1) {
    mean += samples[i] ?? 0;
  }
  mean /= len;

  for (i = 0; i < len; i += 1) {
    centered = (samples[i] ?? 0) - mean;
    output[i] = centered;
    if (Math.abs(centered) > peak) {
      peak = Math.abs(centered);
    }
  }

  if (peak < MIN_NORMALIZABLE_PEAK) {
    return output;
  }

  gain = Math.min(MAX_NORMALIZATION_GAIN, TARGET_SPEECH_PEAK / peak);
  for (i = 0; i < len; i += 1) {
    output[i] = Math.max(-1, Math.min(1, (output[i] ?? 0) * gain));
  }

  return output;
}

export function encodePcmToWavBuffer(
  samples: Float32Array,
  sampleRate: number = AUDIO_SAMPLE_RATE
): ArrayBuffer {
  const safeSampleCount = Math.min(samples.length, MAX_RECORDING_SAMPLES);
  const dataByteLength = safeSampleCount * BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataByteLength);
  const view = new DataView(buffer);
  let offset = WAV_HEADER_BYTES;
  let i = 0;
  let clamped = 0;
  let intSample = 0;

  writeWavHeader(view, dataByteLength, sampleRate);

  for (i = 0; i < safeSampleCount; i += 1) {
    clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    intSample = clamped < 0 ? clamped * INT16_MIN : clamped * INT16_MAX;
    view.setInt16(offset, intSample, true);
    offset += BYTES_PER_SAMPLE;
  }

  return buffer;
}
