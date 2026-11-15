import { useI18n } from '@/ui/i18n/I18nContext';
import type { SupportedLocale } from '@/domain/types';

export interface LanguageToggleProps {
  readonly onChangeLocale?: (locale: SupportedLocale) => void;
}

export function LanguageToggle({ onChangeLocale }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n();
  const nextLocale: SupportedLocale = locale === 'es' ? 'en' : 'es';

  const handleToggle = () => {
    setLocale(nextLocale);
    if (onChangeLocale) {
      onChangeLocale(nextLocale);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="px-2 py-1 rounded-md text-xs font-mono font-medium bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-surface-border)] transition-colors cursor-pointer"
    >
      {locale.toUpperCase()}
    </button>
  );
}
