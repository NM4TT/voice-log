import { useState } from 'react';
import Icon from '@mdi/react';
import { mdiMicrophone, mdiPlus } from '@mdi/js';
import type { LogbookEntry, LogbookMode, LogbookSession } from '@/domain/types';
import { Button } from '@/ui/design-system/Button';
import { EntryTimeline } from '@/ui/components/EntryTimeline';
import { MarkdownPreviewPanel } from '@/ui/components/MarkdownPreviewPanel';
import { useI18n } from '@/ui/i18n/I18nContext';

export interface ReviewLogbookViewProps {
  readonly session: LogbookSession;
  readonly compiledMarkdown: string;
  readonly hasGeminiKey: boolean;
  readonly isAiLoading: boolean;
  readonly onChangeTitle: (title: string) => void;
  readonly onSelectMode: (mode: LogbookMode) => void;
  readonly onStartRecording: () => void;
  readonly onAddManualBlock: () => void;
  readonly onUpdateEntry: (entryId: string, patch: Partial<LogbookEntry>) => void;
  readonly onDeleteEntry: (entryId: string) => void;
  readonly onMoveEntry: (entryId: string, direction: 'UP' | 'DOWN') => void;
  readonly onToggleFrontmatter: () => void;
  readonly onToggleCleanFillers: () => void;
  readonly onRunAiPolish: () => void;
  readonly onResetAiOverride: () => void;
  readonly onDownloadMd: () => void;
  readonly onCopyMd: () => Promise<boolean>;
  readonly onShareMd: () => Promise<boolean>;
  readonly onLoadAudioBlob: (entryId: string) => Promise<Blob | null>;
  readonly onDownloadAudio: (entryId: string, label: string) => void;
}

const MODES: readonly LogbookMode[] = [
  'CHRONO_LOG',
  'QUICK_NOTE',
  'ACTION_ITEMS',
  'DAILY_STANDUP',
];

function ReviewHeaderToolbar({
  title,
  mode,
  onChangeTitle,
  onSelectMode,
  onStartRecording,
  onAddManualBlock,
}: {
  readonly title: string;
  readonly mode: LogbookMode;
  readonly onChangeTitle: (title: string) => void;
  readonly onSelectMode: (mode: LogbookMode) => void;
  readonly onStartRecording: () => void;
  readonly onAddManualBlock: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="bg-[var(--color-surface-card)] border border-[var(--color-surface-border)] rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          aria-label={t.review.sessionTitleLabel}
          className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-base)] text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-base)]"
        />
        <select
          value={mode}
          onChange={(e) => onSelectMode(e.target.value as LogbookMode)}
          className="px-2.5 py-1.5 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-base)] text-xs font-mono font-semibold text-[var(--color-primary-base)]"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="secondary" size="md" onClick={onStartRecording} className="flex-1 sm:flex-initial">
          <Icon path={mdiMicrophone} size={0.8} />
          <span>{t.review.addVoiceBurstBtn}</span>
        </Button>
        <Button variant="ghost" size="md" onClick={onAddManualBlock} className="flex-1 sm:flex-initial">
          <Icon path={mdiPlus} size={0.8} />
          <span>{t.review.addManualBlockBtn}</span>
        </Button>
      </div>
    </div>
  );
}

export function ReviewLogbookView(props: ReviewLogbookViewProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'BLOCKS' | 'MARKDOWN'>('BLOCKS');

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
      <ReviewHeaderToolbar
        title={props.session.title}
        mode={props.session.mode}
        onChangeTitle={props.onChangeTitle}
        onSelectMode={props.onSelectMode}
        onStartRecording={props.onStartRecording}
        onAddManualBlock={props.onAddManualBlock}
      />

      <div className="flex lg:hidden gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('BLOCKS')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
            activeTab === 'BLOCKS'
              ? 'bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)]'
              : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border-[var(--color-surface-border)]'
          }`}
        >
          {t.review.tabBlocks}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MARKDOWN')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
            activeTab === 'MARKDOWN'
              ? 'bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)]'
              : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border-[var(--color-surface-border)]'
          }`}
        >
          {t.review.tabMarkdown}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div
          className={`lg:col-span-6 ${
            activeTab === 'BLOCKS' ? 'block' : 'hidden lg:block'
          }`}
        >
          <EntryTimeline
            entries={props.session.entries}
            mode={props.session.mode}
            onUpdateEntry={props.onUpdateEntry}
            onDeleteEntry={props.onDeleteEntry}
            onMoveEntry={props.onMoveEntry}
            onLoadAudioBlob={props.onLoadAudioBlob}
            onDownloadAudio={props.onDownloadAudio}
          />
        </div>

        <div
          className={`lg:col-span-6 ${
            activeTab === 'MARKDOWN' ? 'block' : 'hidden lg:block'
          }`}
        >
          <MarkdownPreviewPanel
            markdownContent={props.compiledMarkdown}
            includeFrontmatter={props.session.includeFrontmatter}
            cleanFillers={props.session.cleanFillers}
            hasGeminiKey={props.hasGeminiKey}
            hasAiOverride={Boolean(props.session.aiPolishedMarkdown)}
            isAiLoading={props.isAiLoading}
            onToggleFrontmatter={props.onToggleFrontmatter}
            onToggleCleanFillers={props.onToggleCleanFillers}
            onRunAiPolish={props.onRunAiPolish}
            onResetAiOverride={props.onResetAiOverride}
            onDownloadMd={props.onDownloadMd}
            onCopyMd={props.onCopyMd}
            onShareMd={props.onShareMd}
          />
        </div>
      </div>
    </div>
  );
}
