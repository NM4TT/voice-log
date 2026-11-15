import Icon from '@mdi/react';
import { mdiCheck, mdiClose, mdiMicrophone, mdiPlusCircleOutline } from '@mdi/js';
import type { WhisperModelProgressState } from '@/adapters/workers/worker-client';
import type {
  ChronoSeverity,
  EntryBlockKind,
  LogbookMode,
  StandupCategory,
} from '@/domain/types';
import { Button } from '@/ui/design-system/Button';
import { Card } from '@/ui/design-system/Card';
import { useI18n } from '@/ui/i18n/I18nContext';

export interface VoiceRecorderViewProps {
  readonly mode: LogbookMode;
  readonly isProcessing: boolean;
  readonly elapsedSeconds: number;
  readonly waveformBars: readonly number[];
  readonly isSpeaking: boolean;
  readonly liveTranscript: string;
  readonly selectedKind: EntryBlockKind;
  readonly selectedSeverity: ChronoSeverity;
  readonly selectedStandup: StandupCategory;
  readonly whisperProgress: WhisperModelProgressState;
  readonly recorderNotice: string | null;
  readonly onChangeTranscript: (text: string) => void;
  readonly onSelectKind: (kind: EntryBlockKind) => void;
  readonly onSelectSeverity: (severity: ChronoSeverity) => void;
  readonly onSelectStandup: (category: StandupCategory) => void;
  readonly onStopAndSave: () => void;
  readonly onSplitAndContinue: () => void;
  readonly onCancel: () => void;
}

const SEVERITIES: readonly ChronoSeverity[] = ['INFO', 'FIX', 'WARN'];
const STANDUP_CATS: readonly StandupCategory[] = ['PROGRESS', 'NEXT_STEPS', 'BLOCKERS'];

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function WaveformVisualizer({
  bars,
  isSpeaking,
  elapsedSeconds,
  statusLabel,
}: {
  readonly bars: readonly number[];
  readonly isSpeaking: boolean;
  readonly elapsedSeconds: number;
  readonly statusLabel: string;
}) {
  const barColor = isSpeaking
    ? 'bg-[var(--color-secondary-base)]'
    : 'bg-[var(--color-primary-base)]/60';

  return (
    <div className="p-4 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-surface-border)] flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[var(--color-secondary-light)] text-[var(--color-secondary-base)]">
            <Icon path={mdiMicrophone} size={0.8} />
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-secondary-base)]">
            {statusLabel}
          </span>
        </div>
        <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)] px-2.5 py-0.5 rounded bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]">
          {formatTimer(elapsedSeconds)}
        </span>
      </div>

      <div className="h-14 flex items-center justify-between gap-1 px-2">
        {bars.map((height, idx) => (
          <div
            key={idx}
            style={{ height: `${Math.max(10, Math.round(height * 100))}%` }}
            className={`flex-1 rounded-xs transition-all duration-75 ${barColor}`}
          />
        ))}
      </div>
    </div>
  );
}

function BlockKindSelectorBar({
  selectedKind,
  onSelectKind,
}: {
  readonly selectedKind: EntryBlockKind;
  readonly onSelectKind: (kind: EntryBlockKind) => void;
}) {
  const { t } = useI18n();
  const kinds: readonly { readonly kind: EntryBlockKind; readonly label: string }[] = [
    { kind: 'PARAGRAPH', label: t.recorder.kindParagraph },
    { kind: 'HEADING', label: t.recorder.kindHeading },
    { kind: 'TASK_ITEM', label: t.recorder.kindTask },
    { kind: 'CALLOUT_NOTE', label: t.recorder.kindCallout },
    { kind: 'CALLOUT_IMPORTANT', label: t.recorder.kindImportant },
    { kind: 'CODE_BLOCK', label: t.recorder.kindCode },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
        {t.recorder.markerKindLabel}
      </span>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {kinds.map((item) => {
          const active = selectedKind === item.kind;
          const cls = active
            ? 'bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)]'
            : 'bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-surface-border)] hover:bg-[var(--color-surface-muted)]';
          return (
            <button
              key={item.kind}
              type="button"
              onClick={() => onSelectKind(item.kind)}
              className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${cls}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeContextChips({
  mode,
  selectedSeverity,
  selectedStandup,
  onSelectSeverity,
  onSelectStandup,
}: {
  readonly mode: LogbookMode;
  readonly selectedSeverity: ChronoSeverity;
  readonly selectedStandup: StandupCategory;
  readonly onSelectSeverity: (s: ChronoSeverity) => void;
  readonly onSelectStandup: (c: StandupCategory) => void;
}) {
  if (mode === 'CHRONO_LOG') {
    return (
      <div className="flex items-center gap-2">
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => onSelectSeverity(sev)}
            className={`px-3 py-1 rounded-md font-mono text-xs font-semibold border cursor-pointer ${
              selectedSeverity === sev
                ? 'bg-[var(--color-accent-base)] text-white border-[var(--color-accent-base)]'
                : 'bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-surface-border)]'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>
    );
  }
  if (mode === 'DAILY_STANDUP') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {STANDUP_CATS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectStandup(cat)}
            className={`px-3 py-1 rounded-md font-mono text-xs font-semibold border cursor-pointer ${
              selectedStandup === cat
                ? 'bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)]'
                : 'bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border-[var(--color-surface-border)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    );
  }
  return null;
}

function RecorderStatusBanner({
  whisperProgress,
  recorderNotice,
}: {
  readonly whisperProgress: WhisperModelProgressState;
  readonly recorderNotice: string | null;
}) {
  const { t, interpolate } = useI18n();
  const isDownloading = whisperProgress.status === 'DOWNLOADING';
  const progressText = interpolate(t.settings.whisperStatusDownloading, {
    progress: whisperProgress.progress,
  });

  if (!isDownloading && !recorderNotice) return null;

  return (
    <div className="p-3 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-muted)] flex flex-col gap-1.5">
      {recorderNotice && (
        <span className="text-xs text-[var(--color-text-secondary)] leading-4">
          {recorderNotice}
        </span>
      )}
      {isDownloading && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono font-medium text-[var(--color-primary-base)]">
            {progressText}
          </span>
          <div className="w-full h-1.5 rounded-xs bg-[var(--color-surface-border)] overflow-hidden">
            <div
              style={{ width: `${Math.max(2, whisperProgress.progress)}%` }}
              className="h-full bg-[var(--color-primary-base)] transition-all duration-150"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RecorderActionButtons({
  isProcessing,
  onStopAndSave,
  onSplitAndContinue,
  onCancel,
}: {
  readonly isProcessing: boolean;
  readonly onStopAndSave: () => void;
  readonly onSplitAndContinue: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <Button
          variant="primary"
          size="lg"
          disabled={isProcessing}
          onClick={onStopAndSave}
          className="flex-1"
        >
          <Icon path={mdiCheck} size={0.85} />
          <span>{t.recorder.stopAndSaveBtn}</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          disabled={isProcessing}
          onClick={onSplitAndContinue}
        >
          <Icon path={mdiPlusCircleOutline} size={0.8} />
          <span>{t.recorder.splitBlockBtn}</span>
        </Button>
      </div>
      <Button variant="danger" size="md" disabled={isProcessing} onClick={onCancel}>
        <Icon path={mdiClose} size={0.8} />
        <span>{t.common.cancel}</span>
      </Button>
    </div>
  );
}

export function VoiceRecorderView(props: VoiceRecorderViewProps) {
  const { t } = useI18n();
  const statusLabel = props.isProcessing
    ? t.recorder.statusProcessing
    : t.recorder.statusListening;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
      <Card className="p-4 sm:p-6 flex flex-col gap-4">
        <WaveformVisualizer
          bars={props.waveformBars}
          isSpeaking={props.isSpeaking}
          elapsedSeconds={props.elapsedSeconds}
          statusLabel={statusLabel}
        />

        <RecorderStatusBanner
          whisperProgress={props.whisperProgress}
          recorderNotice={props.recorderNotice}
        />

        <BlockKindSelectorBar
          selectedKind={props.selectedKind}
          onSelectKind={props.onSelectKind}
        />

        <ModeContextChips
          mode={props.mode}
          selectedSeverity={props.selectedSeverity}
          selectedStandup={props.selectedStandup}
          onSelectSeverity={props.onSelectSeverity}
          onSelectStandup={props.onSelectStandup}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
            {t.recorder.liveTranscriptLabel}
          </label>
          <textarea
            rows={5}
            value={props.liveTranscript}
            onChange={(e) => props.onChangeTranscript(e.target.value)}
            placeholder={t.recorder.placeholderSpeaking}
            className="w-full p-3 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-base)] text-sm text-[var(--color-text-primary)] leading-6 focus:outline-none focus:border-[var(--color-primary-base)] resize-none select-text"
          />
        </div>

        <RecorderActionButtons
          isProcessing={props.isProcessing}
          onStopAndSave={props.onStopAndSave}
          onSplitAndContinue={props.onSplitAndContinue}
          onCancel={props.onCancel}
        />
      </Card>
    </div>
  );
}
