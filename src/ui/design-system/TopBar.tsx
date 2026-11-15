import Icon from '@mdi/react';
import { mdiCogOutline, mdiInformationOutline, mdiRefresh } from '@mdi/js';
import { useI18n } from '@/ui/i18n/I18nContext';
import { LanguageToggle } from '@/ui/components/LanguageToggle';
import type { SupportedLocale } from '@/domain/types';

export interface TopBarProps {
  readonly title: string;
  readonly entryCount: number;
  readonly wordCount: number;
  readonly onReset: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenInfo: () => void;
  readonly onLocaleChange: (locale: SupportedLocale) => void;
}

function TopBarActions({
  hasEntries,
  badgeText,
  onLocaleChange,
  onOpenSettings,
  onOpenInfo,
  onReset,
}: {
  readonly hasEntries: boolean;
  readonly badgeText: string;
  readonly onLocaleChange: (locale: SupportedLocale) => void;
  readonly onOpenSettings: () => void;
  readonly onOpenInfo: () => void;
  readonly onReset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {hasEntries && (
        <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-base)] font-mono font-medium">
          {badgeText}
        </span>
      )}
      <LanguageToggle onChangeLocale={onLocaleChange} />
      <button
        type="button"
        onClick={onOpenSettings}
        title={t.topBar.settingsTooltip}
        aria-label={t.topBar.settingsTooltip}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
      >
        <Icon path={mdiCogOutline} size={0.85} />
      </button>
      <button
        type="button"
        onClick={onOpenInfo}
        title={t.topBar.infoTooltip}
        aria-label={t.topBar.infoTooltip}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
      >
        <Icon path={mdiInformationOutline} size={0.85} />
      </button>
      <button
        type="button"
        onClick={onReset}
        title={t.topBar.resetTooltip}
        aria-label={t.topBar.resetTooltip}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
      >
        <Icon path={mdiRefresh} size={0.85} />
      </button>
    </div>
  );
}

export function TopBar({
  title,
  entryCount,
  wordCount,
  onReset,
  onOpenSettings,
  onOpenInfo,
  onLocaleChange,
}: TopBarProps) {
  const { t, interpolate } = useI18n();
  const hasEntries = entryCount > 0;
  const entriesBadge = interpolate(t.common.entriesCount, { count: entryCount });
  const wordsBadge = interpolate(t.common.wordsCount, { words: wordCount });
  const badgeText = `${entriesBadge} / ${wordsBadge}`;

  return (
    <header className="w-full bg-[var(--color-surface-card)] border-b border-[var(--color-surface-border)] px-3 sm:px-6 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-primary-base)] truncate">
            {t.common.appSubtitle}
          </span>
          <h1 className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] truncate">
            {title}
          </h1>
        </div>

        <TopBarActions
          hasEntries={hasEntries}
          badgeText={badgeText}
          onLocaleChange={onLocaleChange}
          onOpenSettings={onOpenSettings}
          onOpenInfo={onOpenInfo}
          onReset={onReset}
        />
      </div>

      {hasEntries && (
        <div className="flex sm:hidden items-center">
          <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-base)] font-mono font-medium">
            {badgeText}
          </span>
        </div>
      )}
    </header>
  );
}
