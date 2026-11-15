import { useState } from 'react';
import { assertNever } from '@/domain/types';
import { AboutModal } from '@/ui/components/AboutModal';
import { EngineSettingsModal } from '@/ui/components/EngineSettingsModal';
import { ModeSelector } from '@/ui/components/ModeSelector';
import { ReviewLogbookView } from '@/ui/components/ReviewLogbookView';
import { VoiceRecorderView } from '@/ui/components/VoiceRecorderView';
import { TopBar } from '@/ui/design-system/TopBar';
import {
  useVoiceLogController,
  type RecorderNoticeKind,
} from '@/ui/hooks/useVoiceLogController';
import { I18nProvider, useI18n } from '@/ui/i18n/I18nContext';
import type { TranslationDictionary } from '@/ui/i18n/translations';

function resolveRecorderNoticeText(
  notice: RecorderNoticeKind,
  t: TranslationDictionary
): string | null {
  switch (notice) {
    case null:
      return null;
    case 'FALLBACK_WHISPER':
      return t.recorder.fallbackWhisperNotice;
    case 'MIC_ERROR':
      return t.recorder.micErrorNotice;
    default:
      return assertNever(notice);
  }
}

function ReviewStageContainer({
  ctrl,
  onAddManual,
  onRunAiPolish,
  onDownloadAudio,
}: {
  readonly ctrl: ReturnType<typeof useVoiceLogController>;
  readonly onAddManual: () => void;
  readonly onRunAiPolish: () => void;
  readonly onDownloadAudio: (id: string, label: string) => void;
}) {
  const { session } = ctrl.fsm;

  return (
    <ReviewLogbookView
      session={session}
      compiledMarkdown={ctrl.compiledMarkdown}
      hasGeminiKey={ctrl.hasGeminiKey}
      isAiLoading={ctrl.isAiLoading}
      onChangeTitle={(title) => ctrl.dispatch({ type: 'SET_TITLE', title })}
      onSelectMode={(mode) => ctrl.dispatch({ type: 'SELECT_MODE', mode })}
      onStartRecording={() => void ctrl.startRecordingBurst()}
      onAddManualBlock={onAddManual}
      onUpdateEntry={(entryId, patch) => {
        const current = session.entries.find((e) => e.id === entryId);
        if (current) {
          void ctrl.adapters.storeRef.current.saveEntry({ ...current, ...patch });
        }
        ctrl.dispatch({ type: 'UPDATE_ENTRY', entryId, patch });
      }}
      onDeleteEntry={(entryId) => {
        void ctrl.adapters.storeRef.current.deleteEntry(entryId);
        ctrl.dispatch({ type: 'DELETE_ENTRY', entryId });
      }}
      onMoveEntry={(entryId, direction) =>
        ctrl.dispatch({ type: 'MOVE_ENTRY', entryId, direction })
      }
      onToggleFrontmatter={() => ctrl.dispatch({ type: 'TOGGLE_FRONTMATTER' })}
      onToggleCleanFillers={() => ctrl.dispatch({ type: 'TOGGLE_CLEAN_FILLERS' })}
      onRunAiPolish={onRunAiPolish}
      onResetAiOverride={() => ctrl.dispatch({ type: 'SET_AI_MARKDOWN', markdown: null })}
      onDownloadMd={() => ctrl.downloadMarkdownFile(ctrl.compiledMarkdown, session.title)}
      onCopyMd={() => ctrl.copyMarkdownToClipboard(ctrl.compiledMarkdown)}
      onShareMd={() => ctrl.shareMarkdownNative(ctrl.compiledMarkdown, session.title)}
      onLoadAudioBlob={(id) => ctrl.adapters.storeRef.current.getAudioBlob(id)}
      onDownloadAudio={onDownloadAudio}
    />
  );
}

function StageViewport({
  ctrl,
  onAddManual,
  onRunAiPolish,
  onCancelRecording,
  onDownloadAudio,
}: {
  readonly ctrl: ReturnType<typeof useVoiceLogController>;
  readonly onAddManual: () => void;
  readonly onRunAiPolish: () => void;
  readonly onCancelRecording: () => void;
  readonly onDownloadAudio: (id: string, label: string) => void;
}) {
  const { t } = useI18n();
  const { stage, session } = ctrl.fsm;
  const noticeText = resolveRecorderNoticeText(ctrl.recorderNotice, t);

  switch (stage) {
    case 'IDLE_WELCOME':
      return (
        <ModeSelector
          selectedMode={session.mode}
          sessionTitle={session.title}
          onSelectMode={(mode) => ctrl.dispatch({ type: 'SELECT_MODE', mode })}
          onChangeTitle={(title) => ctrl.dispatch({ type: 'SET_TITLE', title })}
          onStartRecording={() => void ctrl.startRecordingBurst()}
          onAddManualBlock={onAddManual}
        />
      );
    case 'RECORDING_BURST':
    case 'PROCESSING_AUDIO':
      return (
        <VoiceRecorderView
          mode={session.mode}
          isProcessing={stage === 'PROCESSING_AUDIO'}
          elapsedSeconds={ctrl.elapsedSeconds}
          waveformBars={ctrl.waveformBars}
          isSpeaking={ctrl.isSpeaking}
          liveTranscript={ctrl.liveTranscript}
          selectedKind={ctrl.selectedKind}
          selectedSeverity={ctrl.selectedSeverity}
          selectedStandup={ctrl.selectedStandup}
          whisperProgress={ctrl.whisperProgress}
          recorderNotice={noticeText}
          onChangeTranscript={ctrl.setLiveTranscript}
          onSelectKind={ctrl.setSelectedKind}
          onSelectSeverity={ctrl.setSelectedSeverity}
          onSelectStandup={ctrl.setSelectedStandup}
          onStopAndSave={() => void ctrl.finalizeCurrentBurst(false)}
          onSplitAndContinue={() => void ctrl.finalizeCurrentBurst(true)}
          onCancel={onCancelRecording}
        />
      );
    case 'REVIEW_LOGBOOK':
      return (
        <ReviewStageContainer
          ctrl={ctrl}
          onAddManual={onAddManual}
          onRunAiPolish={onRunAiPolish}
          onDownloadAudio={onDownloadAudio}
        />
      );
    default:
      return assertNever(stage);
  }
}

async function executeAiPolish(
  ctrl: ReturnType<typeof useVoiceLogController>
): Promise<void> {
  ctrl.setIsAiLoading(true);
  try {
    const res = await ctrl.adapters.geminiRef.current.structureLogbook(
      ctrl.fsm.session.entries,
      ctrl.fsm.session.mode,
      ctrl.fsm.session.locale
    );
    if (res.markdown) ctrl.dispatch({ type: 'SET_AI_MARKDOWN', markdown: res.markdown });
    if (res.suggestedTitle) ctrl.dispatch({ type: 'SET_TITLE', title: res.suggestedTitle });
    if (res.extractedTags && res.extractedTags.length > 0) {
      ctrl.dispatch({ type: 'SET_TAGS', tags: res.extractedTags });
    }
  } catch {
    // Retains local AST markdown when remote structuring fails
  } finally {
    ctrl.setIsAiLoading(false);
  }
}

function appendManualTextBlock(ctrl: ReturnType<typeof useVoiceLogController>): void {
  const text = ctrl.fsm.session.locale === 'es' ? 'Nuevo bloque de nota.' : 'New note block.';
  const entry = ctrl.buildEntryFromSegment(
    text,
    text,
    { kind: 'PARAGRAPH', severity: 'INFO', standup: 'PROGRESS' },
    0,
    false
  );
  void ctrl.adapters.storeRef.current.saveEntry(entry);
  ctrl.dispatch({ type: 'APPEND_ENTRIES', entries: [entry] });
}

function VoiceLogShell() {
  const { locale } = useI18n();
  const ctrl = useVoiceLogController(locale);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col bg-[var(--color-surface-base)] overflow-hidden">
      <TopBar
        title={ctrl.fsm.session.title}
        entryCount={ctrl.metrics.entryCount}
        wordCount={ctrl.metrics.wordCount}
        onReset={() => {
          ctrl.adapters.recorderRef.current.cancel();
          void ctrl.adapters.storeRef.current.clearAll();
          ctrl.dispatch({ type: 'RESET_SESSION', locale: ctrl.fsm.session.locale });
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenInfo={() => setAboutOpen(true)}
        onLocaleChange={(next) => ctrl.dispatch({ type: 'SET_LOCALE', locale: next })}
      />
      <main className="flex-1 overflow-y-auto">
        <StageViewport
          ctrl={ctrl}
          onAddManual={() => appendManualTextBlock(ctrl)}
          onRunAiPolish={() => void executeAiPolish(ctrl)}
          onCancelRecording={() => {
            void ctrl.adapters.speechRef.current.stopLiveCapture();
            ctrl.adapters.recorderRef.current.cancel();
            ctrl.setLiveTranscript('');
            ctrl.dispatch({ type: 'CANCEL_RECORDING' });
          }}
          onDownloadAudio={(id, label) => {
            void ctrl.adapters.storeRef.current.getAudioBlob(id).then((b) => {
              if (b) ctrl.downloadAudioBlob(b, label);
            });
          }}
        />
      </main>
      <EngineSettingsModal
        isOpen={settingsOpen}
        selectedEngine={ctrl.engine}
        whisperProgress={ctrl.whisperProgress}
        onSelectEngine={ctrl.setEngine}
        onPreloadWhisper={ctrl.preloadWhisperModel}
        onClose={() => setSettingsOpen(false)}
      />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <VoiceLogShell />
    </I18nProvider>
  );
}
