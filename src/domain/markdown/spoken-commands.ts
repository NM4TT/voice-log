import { MAX_SAFE_TEXT_LENGTH } from '@/config/constants';
import {
  capitalizeFirstLetter,
  cleanSpokenTranscript,
} from '@/domain/markdown/filler-cleaner';
import {
  assertNever,
  type EntryBlockKind,
  type ParsedVoiceSegment,
  type SupportedLocale,
} from '@/domain/types';

interface CommandTriggerRule {
  readonly pattern: RegExp;
  readonly kind: EntryBlockKind;
}

const SPANISH_COMMAND_RULES: readonly CommandTriggerRule[] = [
  { pattern: /^(?:nuevo\s+t[íi]tulo|t[íi]tulo|encabezado)\s*[:,-]?\s*/i, kind: 'HEADING' },
  { pattern: /^(?:tarea\s+pendiente|nueva\s+tarea|por\s+hacer|checklist)\s*[:,-]?\s*/i, kind: 'TASK_ITEM' },
  { pattern: /^(?:nota\s+importante|alerta|importante)\s*[:,-]?\s*/i, kind: 'CALLOUT_IMPORTANT' },
  { pattern: /^(?:nota\s+al\s+margen|observaci[óo]n)\s*[:,-]?\s*/i, kind: 'CALLOUT_NOTE' },
  { pattern: /^(?:bloque\s+de\s+c[óo]digo|comando\s+terminal)\s*[:,-]?\s*/i, kind: 'CODE_BLOCK' },
  { pattern: /^(?:nuevo\s+p[áa]rrafo|punto\s+aparte)\s*[:,-]?\s*/i, kind: 'PARAGRAPH' },
];

const ENGLISH_COMMAND_RULES: readonly CommandTriggerRule[] = [
  { pattern: /^(?:new\s+heading|heading|section\s+title)\s*[:,-]?\s*/i, kind: 'HEADING' },
  { pattern: /^(?:todo\s+item|new\s+task|action\s+item)\s*[:,-]?\s*/i, kind: 'TASK_ITEM' },
  { pattern: /^(?:important\s+note|warning\s+callout)\s*[:,-]?\s*/i, kind: 'CALLOUT_IMPORTANT' },
  { pattern: /^(?:side\s+note|note\s+callout)\s*[:,-]?\s*/i, kind: 'CALLOUT_NOTE' },
  { pattern: /^(?:code\s+block|terminal\s+command)\s*[:,-]?\s*/i, kind: 'CODE_BLOCK' },
  { pattern: /^(?:new\s+paragraph|next\s+paragraph)\s*[:,-]?\s*/i, kind: 'PARAGRAPH' },
];

const SENTENCE_SPLIT_ES_REGEX =
  /(?<=[.!?])\s+|\n+|\s+(?=(?:nuevo\s+t[íi]tulo|tarea\s+pendiente|nueva\s+tarea|por\s+hacer|nota\s+importante|nota\s+al\s+margen|bloque\s+de\s+c[óo]digo|comando\s+terminal|nuevo\s+p[áa]rrafo|punto\s+aparte)\b)/i;

const SENTENCE_SPLIT_EN_REGEX =
  /(?<=[.!?])\s+|\n+|\s+(?=(?:new\s+heading|section\s+title|todo\s+item|new\s+task|action\s+item|important\s+note|warning\s+callout|side\s+note|note\s+callout|code\s+block|terminal\s+command|new\s+paragraph|next\s+paragraph)\b)/i;

function getRulesForLocale(locale: SupportedLocale): readonly CommandTriggerRule[] {
  switch (locale) {
    case 'es':
      return SPANISH_COMMAND_RULES;
    case 'en':
      return ENGLISH_COMMAND_RULES;
    default:
      return assertNever(locale);
  }
}

function getSplitRegexForLocale(locale: SupportedLocale): RegExp {
  switch (locale) {
    case 'es':
      return SENTENCE_SPLIT_ES_REGEX;
    case 'en':
      return SENTENCE_SPLIT_EN_REGEX;
    default:
      return assertNever(locale);
  }
}

function formatSegmentContent(
  rawBody: string,
  kind: EntryBlockKind,
  locale: SupportedLocale,
  cleanFillers: boolean
): string {
  const stripped = rawBody.replace(/[.]+$/, '').trim();
  switch (kind) {
    case 'HEADING':
    case 'CODE_BLOCK':
      return capitalizeFirstLetter(stripped);
    case 'PARAGRAPH':
    case 'TASK_ITEM':
    case 'CALLOUT_NOTE':
    case 'CALLOUT_IMPORTANT':
      return cleanSpokenTranscript(stripped, locale, cleanFillers);
    default:
      return assertNever(kind);
  }
}

function classifySingleChunk(
  chunk: string,
  locale: SupportedLocale,
  cleanFillers: boolean
): ParsedVoiceSegment | null {
  const rules = getRulesForLocale(locale);
  const trimmed = chunk.trim();
  let i = 0;
  let rule: CommandTriggerRule | undefined;
  let body: string;

  if (trimmed.length === 0) {
    return null;
  }

  for (i = 0; i < rules.length; i += 1) {
    rule = rules[i];
    if (rule && rule.pattern.test(trimmed)) {
      body = trimmed.replace(rule.pattern, '').trim();
      if (body.length === 0) return null;
      return {
        kind: rule.kind,
        content: formatSegmentContent(body, rule.kind, locale, cleanFillers),
      };
    }
  }

  return {
    kind: 'PARAGRAPH',
    content: cleanSpokenTranscript(trimmed, locale, cleanFillers),
  };
}

export function parseSpokenMarkdownSegments(
  rawTranscript: string,
  locale: SupportedLocale = 'es',
  cleanFillers: boolean = true
): readonly ParsedVoiceSegment[] {
  const safeInput = (rawTranscript || '').slice(0, MAX_SAFE_TEXT_LENGTH);
  const splitRegex = getSplitRegexForLocale(locale);
  const chunks = safeInput.split(splitRegex);
  const segments: ParsedVoiceSegment[] = [];
  let i = 0;
  let parsed: ParsedVoiceSegment | null;

  for (i = 0; i < chunks.length; i += 1) {
    parsed = classifySingleChunk(chunks[i] ?? '', locale, cleanFillers);
    if (parsed && parsed.content.length > 0) {
      segments.push(parsed);
    }
  }

  return Object.freeze(segments);
}
