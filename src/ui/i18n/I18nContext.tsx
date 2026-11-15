import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, STORAGE_KEYS } from '@/config/constants';
import type { SupportedLocale } from '@/domain/types';
import { TRANSLATIONS, type TranslationDictionary } from '@/ui/i18n/translations';

export interface I18nContextValue {
  readonly locale: SupportedLocale;
  readonly t: TranslationDictionary;
  readonly setLocale: (next: SupportedLocale) => void;
  readonly interpolate: (template: string, params: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function loadInitialLocale(): SupportedLocale {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_LOCALE;
  }
  const saved = localStorage.getItem(STORAGE_KEYS.LOCALE);
  return saved === 'en' || saved === 'es' ? saved : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(loadInitialLocale);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOCALE, next);
    }
  }, []);

  const interpolate = useCallback(
    (template: string, params: Record<string, string | number>): string => {
      return Object.entries(params).reduce(
        (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
        template
      );
    },
    []
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        t: TRANSLATIONS[locale],
        setLocale,
        interpolate,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
