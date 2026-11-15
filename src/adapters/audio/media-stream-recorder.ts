import {
  AUDIO_SAMPLE_RATE,
  MAX_RECORDING_SECONDS,
  WAVEFORM_BAR_COUNT,
} from '@/config/constants';
import { analyzeAudioFrame } from '@/domain/audio/vad-detector';
import {
  encodePcmToWavBuffer,
  normalizePcmSpeechLevel,
  resamplePcmToTargetRate,
} from '@/domain/audio/wav-encoder';
import type { AudioRecordingResult, IAudioRecorder } from '@/domain/ports';

const SCRIPT_BUFFER_SIZE = 2048;
const SILENT_GAIN_LEVEL = 0;
const WAVEFORM_UPDATE_INTERVAL_MS = 85;

function mergeFloat32Chunks(chunks: readonly Float32Array[]): Float32Array {
  let totalLength = 0;
  let offset = 0;
  let i = 0;
  let chunk: Float32Array | undefined;
  let merged: Float32Array;

  for (i = 0; i < chunks.length; i += 1) {
    totalLength += chunks[i]?.length ?? 0;
  }

  merged = new Float32Array(totalLength);
  for (i = 0; i < chunks.length; i += 1) {
    chunk = chunks[i];
    if (chunk) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
  }
  return merged;
}

export class MediaStreamRecorder implements IAudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private recordedSampleCount = 0;
  private startedAtMs = 0;
  private lastWaveformEmitMs = 0;

  async start(
    onWaveformUpdate: (bars: readonly number[], rms: number) => void
  ): Promise<void> {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.cleanupResources();
    this.startedAtMs = Date.now();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.setupAudioGraph(onWaveformUpdate);
    } catch (err) {
      this.cleanupResources();
      throw err;
    }
  }

  private setupAudioGraph(
    onWaveformUpdate: (bars: readonly number[], rms: number) => void
  ): void {
    const ctx = this.audioContext;
    const stream = this.stream;
    let maxNativeSamples: number;

    if (!ctx || !stream) return;

    maxNativeSamples = ctx.sampleRate * MAX_RECORDING_SECONDS;
    this.sourceNode = ctx.createMediaStreamSource(stream);
    this.processorNode = ctx.createScriptProcessor(SCRIPT_BUFFER_SIZE, 1, 1);
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = SILENT_GAIN_LEVEL;

    this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
      const input = event.inputBuffer.getChannelData(0);
      const now = Date.now();
      let copy: Float32Array;
      let frame: ReturnType<typeof analyzeAudioFrame>;

      if (this.recordedSampleCount + input.length <= maxNativeSamples) {
        copy = new Float32Array(input.length);
        copy.set(input);
        this.pcmChunks.push(copy);
        this.recordedSampleCount += input.length;
      }
      if (now - this.lastWaveformEmitMs >= WAVEFORM_UPDATE_INTERVAL_MS) {
        this.lastWaveformEmitMs = now;
        frame = analyzeAudioFrame(input, WAVEFORM_BAR_COUNT);
        onWaveformUpdate(frame.waveformBars, frame.rms);
      }
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
  }

  async stop(): Promise<AudioRecordingResult> {
    const durationMs = Math.max(0, Date.now() - this.startedAtMs);
    const nativeSampleRate = this.audioContext?.sampleRate ?? AUDIO_SAMPLE_RATE;
    const mergedNative = mergeFloat32Chunks(this.pcmChunks);
    const resampled = resamplePcmToTargetRate(
      mergedNative,
      nativeSampleRate,
      AUDIO_SAMPLE_RATE
    );
    const pcmSamples = normalizePcmSpeechLevel(resampled);
    const wavBuffer = encodePcmToWavBuffer(pcmSamples, AUDIO_SAMPLE_RATE);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    this.cleanupResources();
    return {
      pcmSamples,
      wavBlob,
      durationMs,
    };
  }

  cancel(): void {
    this.cleanupResources();
  }

  private cleanupResources(): void {
    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
      this.audioContext = null;
    }
    this.pcmChunks = [];
    this.recordedSampleCount = 0;
  }
}
