import Icon from '@mdi/react';
import {
  mdiCheck,
  mdiClose,
  mdiGithub,
  mdiOpenInNew,
  mdiScaleBalance,
  mdiServerOff,
  mdiShieldCheckOutline,
} from '@mdi/js';
import { ENV } from '@/config/env';
import { Button } from '@/ui/design-system/Button';
import { useI18n } from '@/ui/i18n/I18nContext';

export interface AboutModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function AboutHeader({ onClose }: { readonly onClose: () => void }) {
  const { t } = useI18n();

  return (
    <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[var(--color-surface-border)]">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-primary-base)]">
          {t.about.headerSuper}
        </span>
        <h2 className="text-base font-medium text-[var(--color-text-primary)]">
          {t.about.headerTitle}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.about.closeAria}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
      >
        <Icon path={mdiClose} size={0.85} />
      </button>
    </div>
  );
}

function AboutPrivacyItem() {
  const { t } = useI18n();

  return (
    <div className="py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[var(--color-primary-base)]">
        <Icon path={mdiShieldCheckOutline} size={0.75} />
        <h3 className="text-xs uppercase tracking-wider font-semibold">{t.about.privacyTitle}</h3>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {t.about.privacyDesc}
      </p>
    </div>
  );
}

function AboutOpenSourceItem() {
  const { t } = useI18n();

  return (
    <div className="py-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
        <Icon path={mdiGithub} size={0.75} />
        <h3 className="text-xs uppercase tracking-wider font-semibold">{t.about.openSourceTitle}</h3>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {t.about.openSourceDesc}
      </p>
      <a
        href={ENV.publicRepoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-border)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
      >
        <span>{t.about.repoButton}</span>
        <Icon path={mdiOpenInNew} size={0.55} />
      </a>
    </div>
  );
}

function AboutArchitectureItem() {
  const { t } = useI18n();

  return (
    <div className="py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[var(--color-secondary-base)]">
        <Icon path={mdiServerOff} size={0.75} />
        <h3 className="text-xs uppercase tracking-wider font-semibold">{t.about.serverlessTitle}</h3>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {t.about.serverlessDesc}
      </p>
    </div>
  );
}

function AboutDisclaimerItem() {
  const { t } = useI18n();

  return (
    <div className="py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        <Icon path={mdiScaleBalance} size={0.75} />
        <h3 className="text-xs uppercase tracking-wider font-semibold">{t.about.disclaimerTitle}</h3>
      </div>
      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        {t.about.disclaimerDesc}
      </p>
    </div>
  );
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="max-w-md w-full max-h-[85dvh] flex flex-col bg-[var(--color-surface-card)] border border-[var(--color-surface-border)] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col">
          <AboutHeader onClose={onClose} />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 divide-y divide-[var(--color-surface-border)]">
          <AboutPrivacyItem />
          <AboutOpenSourceItem />
          <AboutArchitectureItem />
          <AboutDisclaimerItem />
        </div>
        <div className="shrink-0 p-3 sm:p-4 bg-[var(--color-surface-muted)] border-t border-[var(--color-surface-border)] flex justify-end">
          <Button onClick={onClose} variant="primary" size="sm" className="w-full sm:w-auto">
            <Icon path={mdiCheck} size={0.7} />
            <span>{t.about.understood}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
