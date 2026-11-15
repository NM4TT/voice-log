import { MAX_SAFE_TEXT_LENGTH } from '@/config/constants';
import { assertNever, type SupportedLocale } from '@/domain/types';

const SPANISH_PURE_FILLERS_REGEX =
  /\b(?:eh+|em+|mmm+|estee+|o sea|pues nada)\b[,]?\s*/gi;
const SPANISH_LEADING_BUENO_REGEX = /^\s*bueno\b[,]?\s*/i;
const SPANISH_HESITATION_ESTE_REGEX =
  /(?<=\b(?:y|pero|entonces)\s+)este\b[,]?\s+(?=(?:vimos|creo|pienso|digo|fue|era|estaba|había|hicimos)\b)/gi;
const ENGLISH_FILLERS_REGEX =
  /\b(?:um+|uh+|er+|erm+|like[,]?\s+you know|you know)\b[,]?\s*/gi;
const TERMINAL_PUNCTUATION_REGEX = /[.!?:;]$/;

function stripLanguageFillers(text: string, locale: SupportedLocale): string {
  switch (locale) {
    case 'es':
      return text
        .replace(SPANISH_PURE_FILLERS_REGEX, ' ')
        .replace(SPANISH_LEADING_BUENO_REGEX, '')
        .replace(SPANISH_HESITATION_ESTE_REGEX, '');
    case 'en':
      return text.replace(ENGLISH_FILLERS_REGEX, ' ');
    default:
      return assertNever(locale);
  }
}

export function capitalizeFirstLetter(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '';
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function ensureSentencePunctuation(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '';
  }
  if (TERMINAL_PUNCTUATION_REGEX.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

export function cleanSpokenTranscript(
  rawText: string,
  locale: SupportedLocale = 'es',
  cleanFillers: boolean = true
): string {
  let boundedText: string;
  let processed: string;
  let collapsed: string;
  let capitalized: string;

  if (!rawText || rawText.trim().length === 0) {
    return '';
  }

  boundedText = rawText.slice(0, MAX_SAFE_TEXT_LENGTH);
  processed = cleanFillers ? stripLanguageFillers(boundedText, locale) : boundedText;
  collapsed = processed
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

  if (collapsed.length === 0) {
    return '';
  }

  capitalized = capitalizeFirstLetter(collapsed);
  return ensureSentencePunctuation(capitalized);
}
