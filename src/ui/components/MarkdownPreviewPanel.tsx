import { useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiAutoFix,
  mdiContentCopy,
  mdiDownload,
  mdiRestore,
  mdiShareVariantOutline,
} from '@mdi/js';
import { Button } from '@/ui/design-system/Button';
import { Card } from '@/ui/design-system/Card';
import { useI18n } from '@/ui/i18n/I18nContext';

const COPY_FEEDBACK_MS = 1800;

export interface MarkdownPreviewPanelProps {
  readonly markdownContent: string;
  readonly includeFrontmatter: boolean;
  readonly cleanFillers: boolean;
  readonly hasGeminiKey: boolean;
  readonly hasAiOverride: boolean;
  readonly isAiLoading: boolean;
  readonly onToggleFrontmatter: () => void;
  readonly onToggleCleanFillers: () => void;
  readonly onRunAiPolish: () => void;
  readonly onResetAiOverride: () => void;
  readonly onDownloadMd: () => void;
  readonly onCopyMd: () => Promise<boolean>;
  readonly onShareMd: () => Promise<boolean>;
}

function ToggleChipButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  const cls = active
    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-base)] border-[var(--color-primary-base)]'
    : 'bg-[var(--color-surface-base)] text-[var(--color-text-muted)] border-[var(--color-surface-border)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${cls}`}
    >
      {label}
    </button>
  );
}

function PreviewOptionToggles({
  includeFrontmatter,
  cleanFillers,
  hasGeminiKey,
  hasAiOverride,
  isAiLoading,
  onToggleFrontmatter,
  onToggleCleanFillers,
  onRunAiPolish,
  onResetAiOverride,
}: {
  readonly includeFrontmatter: boolean;
  readonly cleanFillers: boolean;
  readonly hasGeminiKey: boolean;
  readonly hasAiOverride: boolean;
  readonly isAiLoading: boolean;
  readonly onToggleFrontmatter: () => void;
  readonly onToggleCleanFillers: () => void;
  readonly onRunAiPolish: () => void;
  readonly onResetAiOverride: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <ToggleChipButton
        active={includeFrontmatter}
        label={t.review.frontmatterToggle}
        onClick={onToggleFrontmatter}
      />
      <ToggleChipButton
        active={cleanFillers}
        label={t.review.cleanFillersToggle}
        onClick={onToggleCleanFillers}
      />
      {hasGeminiKey && !hasAiOverride && (
        <Button variant="ghost" size="sm" disabled={isAiLoading} onClick={onRunAiPolish}>
          <Icon path={mdiAutoFix} size={0.7} />
          <span>{isAiLoading ? t.review.aiStructuring : t.review.aiStructureBtn}</span>
        </Button>
      )}
      {hasAiOverride && (
        <Button variant="ghost" size="sm" onClick={onResetAiOverride}>
          <Icon path={mdiRestore} size={0.7} />
          <span>{t.review.aiResetBtn}</span>
        </Button>
      )}
    </div>
  );
}

export function MarkdownPreviewPanel(props: MarkdownPreviewPanelProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await props.onCopyMd();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    }
  };

  return (
    <Card className="p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[var(--color-surface-border)] pb-3">
        <PreviewOptionToggles
          includeFrontmatter={props.includeFrontmatter}
          cleanFillers={props.cleanFillers}
          hasGeminiKey={props.hasGeminiKey}
          hasAiOverride={props.hasAiOverride}
          isAiLoading={props.isAiLoading}
          onToggleFrontmatter={props.onToggleFrontmatter}
          onToggleCleanFillers={props.onToggleCleanFillers}
          onRunAiPolish={props.onRunAiPolish}
          onResetAiOverride={props.onResetAiOverride}
        />

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => void handleCopy()}>
            <Icon path={mdiContentCopy} size={0.7} />
            <span>{copied ? t.review.copiedLabel : t.review.copyMdBtn}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void props.onShareMd()}>
            <Icon path={mdiShareVariantOutline} size={0.7} />
            <span className="hidden sm:inline">{t.review.shareBtn}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={props.onDownloadMd}>
            <Icon path={mdiDownload} size={0.75} />
            <span>{t.review.downloadMdBtn}</span>
          </Button>
        </div>
      </div>

      <pre className="w-full flex-1 min-h-[260px] max-h-[520px] overflow-auto p-3.5 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-surface-border)] font-mono text-xs text-[var(--color-text-primary)] leading-5 whitespace-pre-wrap select-text">
        {props.markdownContent}
      </pre>
    </Card>
  );
}
