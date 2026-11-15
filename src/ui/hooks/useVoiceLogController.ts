import { useReducer, useState, useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_TRANSCRIPTION_ENGINE,
  STORAGE_KEYS,
  VAD_RMS_SILENCE_THRESHOLD,
  WAVEFORM_BAR_COUNT,
  WHISPER_MODEL_ID,
} from '@/config/constants';
import { ENV } from '@/config/env';
import { GeminiStructurerAdapter } from '@/adapters/ai/gemini-structurer-adapter';
import { MediaStreamRecorder } from '@/adapters/audio/media-stream-recorder';
import {
  copyMarkdownToClipboard,
  downloadAudioBlob,
  downloadMarkdownFile,
  shareMarkdownNative,
} from '@/adapters/exporters/markdown-exporter';
import { EphemeralIdbStore } from '@/adapters/storage/ephemeral-idb-store';
import { WebSpeechAdapter } from '@/adapters/transcription/web-speech-adapter';
import {
  AudioProcessorWorkerClient,
  type AudioWorkerResult,
  type WhisperModelProgressState,
} from '@/adapters/workers/worker-client';
import {
  compileSessionToMarkdown,
  computeSessionMetrics,
} from '@/domain/markdown/ast-builder';
import { cleanSpokenTranscript } from '@/domain/markdown/filler-cleaner';
import type { AudioRecordingResult } from '@/domain/ports';
import type {
  ChronoSeverity,
  EntryBlockKind,
  LogbookEntry,
  LogbookSession,
  StandupCategory,
  SupportedLocale,
  TranscriptionEngineId,
} from '@/domain/types';
import {
  createInitialSessionState,
  transitionSessionState,
  type SessionAction,
} from '@/ui/fsm/session-fsm';

export type RecorderNoticeKind = 'FALLBACK_WHISPER' | 'MIC_ERROR' | null;

const INITIAL_BARS: readonly number[] = new Array<number>(WAVEFORM_BAR_COUNT).fill(0.08);
const INITIAL_WHISPER_PROGRESS: WhisperModelProgressState = {
  status: 'IDLE',
  progress: 0,
  file: WHISPER_MODEL_ID,
};

interface RecorderSelectionState {
  readonly kind: EntryBlockKind;
  readonly severity: ChronoSeverity;
  readonly standup: StandupCategory;
}

function loadInitialEnginePreference(speechSupported: boolean): TranscriptionEngineId {
  let saved: string | null = null;
  if (typeof localStorage !== 'undefined') {
    saved = localStorage.getItem(STORAGE_KEYS.ENGINE_PREFERENCE);
  }
  if (
    saved === 'HYBRID_WEB_SPEECH' ||
    saved === 'WHISPER_WORKER' ||
    saved === 'MANUAL_ASSISTED'
  ) {
    return saved;
  }
  return speechSupported ? DEFAULT_TRANSCRIPTION_ENGINE : 'WHISPER_WORKER';
}

export function buildEntryFromSegment(
  content: string,
  rawTranscript: string,
  sel: RecorderSelectionState,
  durationMs: number,
  hasAudio: boolean
): LogbookEntry {
  const now = new Date();
  return {
    id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAtIso: now.toISOString(),
    timestampLabel: now.toTimeString().slice(0, 8),
    rawTranscript,
    cleanedText: content,
    kind: sel.kind,
    completed: false,
    chronoSeverity: sel.severity,
    standupCategory: sel.standup,
    durationMs,
    hasAudio,
    tags: [],
  };
}

function mapWorkerOutputToEntries(
  workerOut: AudioWorkerResult,
  combinedRaw: string,
  session: LogbookSession,
  sel: RecorderSelectionState,
  durationMs: number,
  hasAudio: boolean
): LogbookEntry[] {
  const effectiveRaw = workerOut.resolvedTranscript || combinedRaw;
  let fallbackText: string;

  if (workerOut.segments.length === 0) {
    fallbackText = cleanSpokenTranscript(
      effectiveRaw ||
        (session.locale === 'es' ? 'Nota de audio capturada' : 'Captured voice note'),
      session.locale,
      session.cleanFillers
    );
    return [buildEntryFromSegment(fallbackText, effectiveRaw, sel, durationMs, hasAudio)];
  }

  return workerOut.segments.map((seg, idx) =>
    buildEntryFromSegment(
      seg.content,
      effectiveRaw,
      {
        ...sel,
        kind: idx === 0 && sel.kind !== 'PARAGRAPH' ? sel.kind : seg.kind,
      },
      idx === 0 ? durationMs : 0,
      hasAudio
    )
  );
}

function useElapsedRecordingTimer(isRecording: boolean): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  return elapsedSeconds;
}

function useBurstAdapters() {
  const recorderRef = useRef(new MediaStreamRecorder());
  const speechRef = useRef(new WebSpeechAdapter());
  const workerRef = useRef(new AudioProcessorWorkerClient());
  const storeRef = useRef(new EphemeralIdbStore());
  const geminiRef = useRef(new GeminiStructurerAdapter(ENV.geminiApiKey));

  return { recorderRef, speechRef, workerRef, storeRef, geminiRef };
}

function useWorkerAndStoreLifecycle(
  adapters: ReturnType<typeof useBurstAdapters>,
  engine: TranscriptionEngineId,
  setWhisperProgress: (state: WhisperModelProgressState) => void,
  dispatch: (action: SessionAction) => void
): void {
  useEffect(() => {
    adapters.workerRef.current.setProgressListener(setWhisperProgress);
    void adapters.storeRef.current.getEntries().then((saved) => {
      if (saved.length > 0) {
        dispatch({ type: 'APPEND_ENTRIES', entries: saved });
      }
    });
    return () => {
      adapters.workerRef.current.setProgressListener(null);
    };
  }, [adapters.storeRef, adapters.workerRef, dispatch, setWhisperProgress]);

  useEffect(() => {
    if (engine === 'WHISPER_WORKER') {
      void adapters.workerRef.current.preloadWhisperModel();
    }
  }, [adapters.workerRef, engine]);
}

async function stopActiveCaptureAdapters(
  adapters: ReturnType<typeof useBurstAdapters>,
  engine: TranscriptionEngineId
): Promise<{ readonly audioRes: AudioRecordingResult; readonly speechText: string }> {
  let audioRes: AudioRecordingResult = {
    pcmSamples: new Float32Array(0),
    wavBlob: new Blob(),
    durationMs: 0,
  };
  let speechText = '';

  try {
    if (engine === 'HYBRID_WEB_SPEECH') {
      speechText = await adapters.speechRef.current.stopLiveCapture();
    }
    audioRes = await adapters.recorderRef.current.stop();
  } catch {
    // Fallback when audio device stops early
  }

  return { audioRes, speechText };
}

function useRecordingCallbacks(params: {
  readonly adapters: ReturnType<typeof useBurstAdapters>;
  readonly engine: TranscriptionEngineId;
  readonly session: LogbookSession;
  readonly selection: RecorderSelectionState;
  readonly latestTranscriptRef: { current: string };
  readonly setLiveTranscript: (text: string) => void;
  readonly setRecorderNotice: (notice: RecorderNoticeKind) => void;
  readonly setWaveformBars: (bars: readonly number[]) => void;
  readonly setIsSpeaking: (speaking: boolean) => void;
  readonly dispatch: (action: SessionAction) => void;
}) {
  const {
    adapters,
    engine,
    session,
    selection,
    latestTranscriptRef,
    setLiveTranscript,
    setRecorderNotice,
    setWaveformBars,
    setIsSpeaking,
    dispatch,
  } = params;

  const startRecordingBurst = useCallback(async () => {
    setLiveTranscript('');
    setRecorderNotice(null);
    setWaveformBars(INITIAL_BARS);
    dispatch({ type: 'START_RECORDING' });

    try {
      await adapters.recorderRef.current.start((bars, rms) => {
        setWaveformBars(bars);
        setIsSpeaking(rms >= VAD_RMS_SILENCE_THRESHOLD);
      });
    } catch {
      setRecorderNotice('MIC_ERROR');
    }

    if (engine === 'HYBRID_WEB_SPEECH') {
      await adapters.speechRef.current.startLiveCapture(
        session.locale,
        (text) => setLiveTranscript(text),
        () => {
          setRecorderNotice('FALLBACK_WHISPER');
          void adapters.workerRef.current.preloadWhisperModel();
        }
      );
    }
  }, [adapters, dispatch, engine, session.locale, setIsSpeaking, setLiveTranscript, setRecorderNotice, setWaveformBars]);

  const finalizeCurrentBurst = useCallback(
    async (restartAfter: boolean) => {
      dispatch({ type: 'FINISH_RECORDING_RAW' });
      const { audioRes, speechText } = await stopActiveCaptureAdapters(adapters, engine);
      const combined = latestTranscriptRef.current.trim() || speechText.trim();
      const workerOut = await adapters.workerRef.current.processRecording(
        audioRes.pcmSamples,
        combined,
        session.locale,
        engine === 'WHISPER_WORKER',
        session.cleanFillers
      );
      const entries = mapWorkerOutputToEntries(
        workerOut,
        combined,
        session,
        selection,
        audioRes.durationMs,
        audioRes.pcmSamples.length > 0
      );
      for (const entry of entries) {
        await adapters.storeRef.current.saveEntry(entry, entry.hasAudio ? audioRes.wavBlob : undefined);
      }
      dispatch({ type: 'APPEND_ENTRIES', entries });
      setLiveTranscript('');
      if (restartAfter) await startRecordingBurst();
    },
    [adapters, dispatch, engine, latestTranscriptRef, selection, session, setLiveTranscript, startRecordingBurst]
  );

  return { startRecordingBurst, finalizeCurrentBurst };
}

export function useVoiceLogController(locale: SupportedLocale) {
  const adapters = useBurstAdapters();
  const [fsm, dispatch] = useReducer(transitionSessionState, locale, createInitialSessionState);
  const [engine, setEngineState] = useState<TranscriptionEngineId>(() =>
    loadInitialEnginePreference(adapters.speechRef.current.isSupported())
  );
  const [whisperProgress, setWhisperProgress] = useState<WhisperModelProgressState>(INITIAL_WHISPER_PROGRESS);
  const [recorderNotice, setRecorderNotice] = useState<RecorderNoticeKind>(null);
  const [liveTranscript, setLiveTranscriptState] = useState('');
  const latestTranscriptRef = useRef('');
  const [selectedKind, setSelectedKind] = useState<EntryBlockKind>('PARAGRAPH');
  const [selectedSeverity, setSelectedSeverity] = useState<ChronoSeverity>('INFO');
  const [selectedStandup, setSelectedStandup] = useState<StandupCategory>('PROGRESS');
  const [waveformBars, setWaveformBars] = useState<readonly number[]>(INITIAL_BARS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const elapsedSeconds = useElapsedRecordingTimer(fsm.stage === 'RECORDING_BURST');

  const setLiveTranscript = useCallback((text: string) => {
    latestTranscriptRef.current = text;
    setLiveTranscriptState(text);
  }, []);

  const setEngine = useCallback((next: TranscriptionEngineId) => {
    setEngineState(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ENGINE_PREFERENCE, next);
    }
  }, []);

  useWorkerAndStoreLifecycle(adapters, engine, setWhisperProgress, dispatch);

  const { startRecordingBurst, finalizeCurrentBurst } = useRecordingCallbacks({
    adapters,
    engine,
    session: fsm.session,
    selection: { kind: selectedKind, severity: selectedSeverity, standup: selectedStandup },
    latestTranscriptRef,
    setLiveTranscript,
    setRecorderNotice,
    setWaveformBars,
    setIsSpeaking,
    dispatch,
  });

  return {
    fsm,
    dispatch,
    engine,
    setEngine,
    whisperProgress,
    preloadWhisperModel: () => void adapters.workerRef.current.preloadWhisperModel(),
    recorderNotice,
    liveTranscript,
    setLiveTranscript,
    selectedKind,
    setSelectedKind,
    selectedSeverity,
    setSelectedSeverity,
    selectedStandup,
    setSelectedStandup,
    waveformBars,
    isSpeaking,
    elapsedSeconds,
    isAiLoading,
    setIsAiLoading,
    adapters,
    compiledMarkdown: compileSessionToMarkdown(fsm.session),
    metrics: computeSessionMetrics(fsm.session.entries),
    hasGeminiKey: Boolean(ENV.geminiApiKey),
    startRecordingBurst,
    finalizeCurrentBurst,
    downloadAudioBlob,
    downloadMarkdownFile,
    copyMarkdownToClipboard,
    shareMarkdownNative,
    buildEntryFromSegment,
  };
}
