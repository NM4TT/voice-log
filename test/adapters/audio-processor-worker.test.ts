import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleWorkerMessage,
  resetWhisperPipelineForTests,
  type WorkerIncomingMessage,
  type WorkerOutgoingMessage,
} from '@/adapters/workers/audio-processor.worker';

let capturedDtype: unknown = null;
let capturedAudioPeak = 0;

vi.mock('@huggingface/transformers', () => {
  return {
    env: {
      allowLocalModels: false,
      useBrowserCache: true,
    },
    pipeline: vi.fn(
      async (
        _task: string,
        model: string,
        options?: {
          dtype?: unknown;
          progress_callback?: (info: Record<string, unknown>) => void;
        }
      ) => {
        capturedDtype = options?.dtype ?? null;
        options?.progress_callback?.({
          status: 'progress',
          name: model,
          file: 'onnx/decoder_model_merged_quantized.onnx',
          progress: 55,
          loaded: 55,
          total: 100,
        });
        options?.progress_callback?.({
          status: 'ready',
          task: 'automatic-speech-recognition',
          model,
        });
        return async (audio: Float32Array) => {
          capturedAudioPeak = Math.max(...Array.from(audio).map((v) => Math.abs(v)));
          return {
            text: 'nuevo título Bitácora desde Whisper tarea pendiente validar descarga wasm',
          };
        };
      }
    ),
  };
});

describe('adapters/workers/audio-processor.worker', () => {
  beforeEach(() => {
    capturedDtype = null;
    capturedAudioPeak = 0;
    resetWhisperPipelineForTests();
  });

  it('downloads Whisper model on PRELOAD_MODEL with mixed fp32/q8 precision and emits progress events up to READY', async () => {
    const emitted: WorkerOutgoingMessage[] = [];
    const req: WorkerIncomingMessage = {
      kind: 'PRELOAD_MODEL',
      requestId: 'preload-1',
    };

    await handleWorkerMessage(req, (msg) => emitted.push(msg));

    expect(capturedDtype).toEqual({
      encoder_model: 'fp32',
      decoder_model_merged: 'q8',
    });
    const progressEvents = emitted.filter((m) => m.kind === 'MODEL_PROGRESS');
    expect(progressEvents.length).toBeGreaterThanOrEqual(2);
    expect(progressEvents.some((p) => p.status === 'DOWNLOADING' && p.progress === 55)).toBe(true);
    expect(progressEvents.at(-1)?.status).toBe('READY');
    expect(emitted.at(-1)).toEqual({
      kind: 'PRELOAD_DONE',
      requestId: 'preload-1',
      ready: true,
    });
  });

  it('normalizes PCM speech level and transcribes with Whisper when useWhisperOffline is enabled', async () => {
    const emitted: WorkerOutgoingMessage[] = [];
    const activeAudio = new Float32Array(6400);
    for (let i = 0; i < activeAudio.length; i += 1) {
      activeAudio[i] = i % 2 === 0 ? 0.12 : -0.12;
    }
    const req: WorkerIncomingMessage = {
      kind: 'PROCESS_AUDIO',
      requestId: 'proc-1',
      pcmBuffer: activeAudio.buffer,
      rawTranscript: '',
      locale: 'es',
      useWhisperOffline: true,
      cleanFillers: true,
    };

    await handleWorkerMessage(req, (msg) => emitted.push(msg));

    expect(capturedAudioPeak).toBeCloseTo(0.89, 2);
    const resultMsg = emitted.find((m) => m.kind === 'PROCESS_RESULT');
    expect(resultMsg).toBeDefined();
    if (resultMsg && resultMsg.kind === 'PROCESS_RESULT') {
      expect(resultMsg.usedWhisper).toBe(true);
      expect(resultMsg.resolvedTranscript).toContain('Bitácora desde Whisper');
      expect(resultMsg.segments).toHaveLength(2);
      expect(resultMsg.segments[0]?.kind).toBe('HEADING');
      expect(resultMsg.segments[1]?.kind).toBe('TASK_ITEM');
    }
  });
});
