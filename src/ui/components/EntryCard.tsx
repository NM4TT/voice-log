import { useState, useEffect, useRef } from 'react';
import Icon from '@mdi/react';
import {
  mdiArrowDown,
  mdiArrowUp,
  mdiCheckboxBlankOutline,
  mdiCheckboxMarked,
  mdiDeleteOutline,
  mdiDownloadOutline,
  mdiPlay,
  mdiStop,
} from '@mdi/js';
import type {
  ChronoSeverity,
  EntryBlockKind,
  LogbookEntry,
  LogbookMode,
  StandupCategory,
} from '@/domain/types';
import { Card } from '@/ui/design-system/Card';
import { useI18n } from '@/ui/i18n/I18nContext';

export interface EntryCardProps {
  readonly entry: LogbookEntry;
  readonly mode: LogbookMode;
  readonly index: number;
  readonly total: number;
  readonly onUpdate: (entryId: string, patch: Partial<LogbookEntry>) => void;
  readonly onDelete: (entryId: string) => void;
  readonly onMove: (entryId: string, direction: 'UP' | 'DOWN') => void;
  readonly onLoadAudioBlob: (entryId: string) => Promise<Blob | null>;
  readonly onDownloadAudio: (entryId: string, label: string) => void;
}

const KINDS: readonly EntryBlockKind[] = [
  'PARAGRAPH',
  'HEADING',
  'TASK_ITEM',
  'CALLOUT_NOTE',
  'CALLOUT_IMPORTANT',
  'CODE_BLOCK',
];
const SEVERITIES: readonly ChronoSeverity[] = ['INFO', 'FIX', 'WARN'];
const STANDUPS: readonly StandupCategory[] = ['PROGRESS', 'NEXT_STEPS', 'BLOCKERS'];

function stopAndCleanupAudio(
  audioRef: { current: HTMLAudioElement | null },
  urlRef: { current: string | null }
): void {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }
}

function EntryAudioControls({
  entryId,
  hasAudio,
  timestampLabel,
  onLoadAudioBlob,
  onDownloadAudio,
}: {
  readonly entryId: string;
  readonly hasAudio: boolean;
  readonly timestampLabel: string;
  readonly onLoadAudioBlob: (id: string) => Promise<Blob | null>;
  readonly onDownloadAudio: (id: string, label: string) => void;
}) {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => stopAndCleanupAudio(audioRef, urlRef), []);

  if (!hasAudio) return null;

  const togglePlay = async () => {
    let blob: Blob | null;
    let player: HTMLAudioElement;

    if (isPlaying) {
      stopAndCleanupAudio(audioRef, urlRef);
      setIsPlaying(false);
      return;
    }

    blob = await onLoadAudioBlob(entryId);
    if (!blob) return;

    stopAndCleanupAudio(audioRef, urlRef);
    urlRef.current = URL.createObjectURL(blob);
    player = new Audio(urlRef.current);
    audioRef.current = player;
    player.onended = () => setIsPlaying(false);
    setIsPlaying(true);
    try {
      await player.play();
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => void togglePlay()}
        title={isPlaying ? t.review.stopAudioTooltip : t.review.playAudioTooltip}
        className="px-2 py-1 rounded-md text-xs font-mono bg-[var(--color-secondary-light)] text-[var(--color-secondary-base)] hover:opacity-90 flex items-center gap-1 cursor-pointer"
      >
        <Icon path={isPlaying ? mdiStop : mdiPlay} size={0.65} />
        <span>WAV</span>
      </button>
      <button
        type="button"
        onClick={() => onDownloadAudio(entryId, `bloque-${timestampLabel}`)}
        title={t.review.downloadWavTooltip}
        className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
      >
        <Icon path={mdiDownloadOutline} size={0.7} />
      </button>
    </div>
  );
}

function EntryMetadataSelects({
  entry,
  mode,
  onUpdate,
}: {
  readonly entry: LogbookEntry;
  readonly mode: LogbookMode;
  readonly onUpdate: (entryId: string, patch: Partial<LogbookEntry>) => void;
}) {
  return (
    <>
      <select
        value={entry.kind}
        onChange={(e) => onUpdate(entry.id, { kind: e.target.value as EntryBlockKind })}
        className="text-xs px-2 py-0.5 rounded border border-[var(--color-surface-border)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] font-medium"
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      {mode === 'CHRONO_LOG' && (
        <select
          value={entry.chronoSeverity}
          onChange={(e) =>
            onUpdate(entry.id, { chronoSeverity: e.target.value as ChronoSeverity })
          }
          className="text-xs font-mono px-2 py-0.5 rounded border border-[var(--color-surface-border)] bg-[var(--color-accent-light)] text-[var(--color-accent-base)] font-semibold"
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {mode === 'DAILY_STANDUP' && (
        <select
          value={entry.standupCategory}
          onChange={(e) =>
            onUpdate(entry.id, { standupCategory: e.target.value as StandupCategory })
          }
          className="text-xs font-mono px-2 py-0.5 rounded border border-[var(--color-surface-border)] bg-[var(--color-primary-light)] text-[var(--color-primary-base)] font-semibold"
        >
          {STANDUPS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      )}
    </>
  );
}

function EntryActionToolbar({
  entryId,
  index,
  total,
  onMove,
  onDelete,
}: {
  readonly entryId: string;
  readonly index: number;
  readonly total: number;
  readonly onMove: (entryId: string, direction: 'UP' | 'DOWN') => void;
  readonly onDelete: (entryId: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(entryId, 'UP')}
        className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] disabled:opacity-30 cursor-pointer"
      >
        <Icon path={mdiArrowUp} size={0.7} />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(entryId, 'DOWN')}
        className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] disabled:opacity-30 cursor-pointer"
      >
        <Icon path={mdiArrowDown} size={0.7} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(entryId)}
        className="p-1 rounded text-[var(--color-danger-base)] hover:bg-[var(--color-danger-light)] cursor-pointer"
      >
        <Icon path={mdiDeleteOutline} size={0.75} />
      </button>
    </div>
  );
}

export function EntryCard({
  entry,
  mode,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
  onLoadAudioBlob,
  onDownloadAudio,
}: EntryCardProps) {
  const showCheckbox = mode === 'ACTION_ITEMS' || entry.kind === 'TASK_ITEM';

  return (
    <Card className="p-3.5 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
            [{entry.timestampLabel}]
          </span>
          <EntryMetadataSelects entry={entry} mode={mode} onUpdate={onUpdate} />
          <EntryAudioControls
            entryId={entry.id}
            hasAudio={entry.hasAudio}
            timestampLabel={entry.timestampLabel}
            onLoadAudioBlob={onLoadAudioBlob}
            onDownloadAudio={onDownloadAudio}
          />
        </div>
        <EntryActionToolbar
          entryId={entry.id}
          index={index}
          total={total}
          onMove={onMove}
          onDelete={onDelete}
        />
      </div>

      <div className="flex items-start gap-2">
        {showCheckbox && (
          <button
            type="button"
            onClick={() => onUpdate(entry.id, { completed: !entry.completed })}
            className="mt-1.5 text-[var(--color-primary-base)] cursor-pointer"
          >
            <Icon
              path={entry.completed ? mdiCheckboxMarked : mdiCheckboxBlankOutline}
              size={0.85}
            />
          </button>
        )}
        <textarea
          rows={2}
          value={entry.cleanedText}
          onChange={(e) => onUpdate(entry.id, { cleanedText: e.target.value })}
          className="flex-1 p-2 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-base)] text-sm text-[var(--color-text-primary)] leading-5 focus:outline-none focus:border-[var(--color-primary-base)] resize-y select-text"
        />
      </div>
    </Card>
  );
}
