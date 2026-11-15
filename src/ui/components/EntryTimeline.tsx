import type { LogbookEntry, LogbookMode } from '@/domain/types';
import { EntryCard } from '@/ui/components/EntryCard';
import { useI18n } from '@/ui/i18n/I18nContext';

export interface EntryTimelineProps {
  readonly entries: readonly LogbookEntry[];
  readonly mode: LogbookMode;
  readonly onUpdateEntry: (entryId: string, patch: Partial<LogbookEntry>) => void;
  readonly onDeleteEntry: (entryId: string) => void;
  readonly onMoveEntry: (entryId: string, direction: 'UP' | 'DOWN') => void;
  readonly onLoadAudioBlob: (entryId: string) => Promise<Blob | null>;
  readonly onDownloadAudio: (entryId: string, label: string) => void;
}

export function EntryTimeline({
  entries,
  mode,
  onUpdateEntry,
  onDeleteEntry,
  onMoveEntry,
  onLoadAudioBlob,
  onDownloadAudio,
}: EntryTimelineProps) {
  const { t } = useI18n();

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        {t.review.emptyEntriesHint}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, idx) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          mode={mode}
          index={idx}
          total={entries.length}
          onUpdate={onUpdateEntry}
          onDelete={onDeleteEntry}
          onMove={onMoveEntry}
          onLoadAudioBlob={onLoadAudioBlob}
          onDownloadAudio={onDownloadAudio}
        />
      ))}
    </div>
  );
}
