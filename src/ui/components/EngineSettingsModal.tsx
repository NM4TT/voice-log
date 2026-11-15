import Icon from '@mdi/react';
import { mdiCheck, mdiClose, mdiDownload } from '@mdi/js';
import type { WhisperModelProgressState } from '@/adapters/workers/worker-client';
import { assertNever, type TranscriptionEngineId } from '@/domain/types';
import { Button } from '@/ui/design-system/Button';
import { Card } from '@/ui/design-system/Card';
import { useI18n, type I18nContextValue } from '@/ui/i18n/I18nContext';

export interface EngineSettingsModalProps {
  readonly isOpen: boolean;
  readonly selectedEngine: TranscriptionEngineId;
  readonly whisperProgress: WhisperModelProgressState;
  readonly onSelectEngine: (engine: TranscriptionEngineId) => void;
  readonly onPreloadWhisper: () => void;
  readonly onClose: () => void;
}

function getWhisperStatusText(
  state: WhisperModelProgressState,
  i18n: I18nContextValue
): string {
  const { status } = state;
  switch (status) {
    case 'IDLE':
      return i18n.t.settings.whisperStatusIdle;
    case 'DOWNLOADING':
      return i18n.interpolate(i18n.t.settings.whisperStatusDownloading, {
        progress: state.progress,
      });
    case 'READY':
      return i18n.t.settings.whisperStatusReady;
    case 'ERROR':
      return state.errorMessage
        ? `${i18n.t.settings.whisperStatusError}: ${state.errorMessage}`
        : i18n.t.settings.whisperStatusError;
    default:
      return assertNever(status);
  }
}

function WhisperDownloadBanner({
  whisperProgress,
  onPreloadWhisper,
}: {
  readonly whisperProgress: WhisperModelProgressState;
  readonly onPreloadWhisper: () => void;
}) {
  const i18n = useI18n();
  const label = getWhisperStatusText(whisperProgress, i18n);
  const isDownloading = whisperProgress.status === 'DOWNLOADING';
  const isReady = whisperProgress.status === 'READY';
  const barWidth = isReady ? 100 : Math.max(0, Math.min(100, whisperProgress.progress));

  return (
    <div className="p-3 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-muted)] flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-medium text-[var(--color-text-primary)]">
          {label}
        </span>
        {!isDownloading && !isReady && (
          <Button variant="secondary" size="sm" onClick={onPreloadWhisper}>
            <Icon path={mdiDownload} size={0.65} />
            <span>{i18n.t.settings.whisperDownloadBtn}</span>
          </Button>
        )}
        {isReady && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[var(--color-primary-base)]">
            <Icon path={mdiCheck} size={0.65} />
            <span>ONNX</span>
          </span>
        )}
      </div>
      {(isDownloading || isReady) && (
        <div className="w-full h-2 rounded-xs bg-[var(--color-surface-border)] overflow-hidden">
          <div
            style={{ width: `${barWidth}%` }}
            className="h-full bg-[var(--color-primary-base)] transition-all duration-150"
          />
        </div>
      )}
      {isDownloading && whisperProgress.file && (
        <span className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">
          {whisperProgress.file}
        </span>
      )}
    </div>
  );
}

function EngineOptionRow({
  id,
  selected,
  title,
  desc,
  onSelect,
}: {
  readonly id: TranscriptionEngineId;
  readonly selected: boolean;
  readonly title: string;
  readonly desc: string;
  readonly onSelect: (engine: TranscriptionEngineId) => void;
}) {
  const cls = selected
    ? 'border-[var(--color-primary-base)] bg-[var(--color-primary-light)]/50'
    : 'border-[var(--color-surface-border)] bg-[var(--color-surface-base)]';

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex flex-col gap-1 ${cls}`}
    >
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
      <span className="text-xs text-[var(--color-text-secondary)] leading-4">{desc}</span>
    </button>
  );
}

export function EngineSettingsModal({
  isOpen,
  selectedEngine,
  whisperProgress,
  onSelectEngine,
  onPreloadWhisper,
  onClose,
}: EngineSettingsModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-5 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--color-surface-border)] pb-3">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
            {t.settings.modalTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
          >
            <Icon path={mdiClose} size={0.85} />
          </button>
        </div>

        <div className="divide-y divide-[var(--color-surface-border)] flex flex-col">
          <div className="pb-4 flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-primary-base)]">
              {t.settings.engineSection}
            </span>
            <EngineOptionRow
              id="HYBRID_WEB_SPEECH"
              selected={selectedEngine === 'HYBRID_WEB_SPEECH'}
              title={t.settings.engineWebSpeech}
              desc={t.settings.engineWebSpeechDesc}
              onSelect={onSelectEngine}
            />
            <EngineOptionRow
              id="WHISPER_WORKER"
              selected={selectedEngine === 'WHISPER_WORKER'}
              title={t.settings.engineWhisper}
              desc={t.settings.engineWhisperDesc}
              onSelect={onSelectEngine}
            />
            <EngineOptionRow
              id="MANUAL_ASSISTED"
              selected={selectedEngine === 'MANUAL_ASSISTED'}
              title={t.settings.engineManual}
              desc={t.settings.engineManualDesc}
              onSelect={onSelectEngine}
            />
            {(selectedEngine === 'WHISPER_WORKER' || whisperProgress.status !== 'IDLE') && (
              <div className="pt-1">
                <WhisperDownloadBanner
                  whisperProgress={whisperProgress}
                  onPreloadWhisper={onPreloadWhisper}
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {t.settings.commandsSection}
            </span>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {t.settings.commandsHelp}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="primary" size="md" onClick={onClose}>
            {t.common.close}
          </Button>
        </div>
      </Card>
    </div>
  );
}
