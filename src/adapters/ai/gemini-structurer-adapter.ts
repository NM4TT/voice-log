import type { AiStructureResult, IAiStructurer } from '@/domain/ports';
import type { LogbookEntry, LogbookMode, SupportedLocale } from '@/domain/types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiStructureJson {
  markdown?: unknown;
  suggestedTitle?: unknown;
  extractedTags?: unknown;
}

function buildStructuringPrompt(
  entries: readonly LogbookEntry[],
  mode: LogbookMode,
  locale: SupportedLocale
): string {
  const langInstruction =
    locale === 'es'
      ? 'Estructurar en español profesional y conciso.'
      : 'Structure in concise professional English.';
  const serializedEntries = entries
    .map(
      (e, idx) =>
        `[${idx + 1}] (${e.timestampLabel} | ${e.kind} | ${e.chronoSeverity} | ${e.standupCategory}): ${e.cleanedText}`
    )
    .join('\n');

  return [
    'You are an editorial technical logbook assistant.',
    langInstruction,
    `Target logbook workflow mode: ${mode}.`,
    'Transform the following voice logbook entries into a clean, well-structured Markdown body (without YAML frontmatter, no emojis).',
    'Return strictly JSON matching schema: {"markdown": string, "suggestedTitle": string, "extractedTags": string[]}',
    'Entries:',
    serializedEntries,
  ].join('\n');
}

function parseGeminiResponse(rawText: string): AiStructureResult {
  let parsed: GeminiStructureJson;
  let markdown: string;
  let suggestedTitle: string | undefined;
  let extractedTags: string[] | undefined;

  try {
    parsed = JSON.parse(rawText) as GeminiStructureJson;
  } catch {
    return { markdown: rawText.trim() };
  }

  markdown = typeof parsed.markdown === 'string' ? parsed.markdown.trim() : '';
  suggestedTitle =
    typeof parsed.suggestedTitle === 'string' && parsed.suggestedTitle.trim().length > 0
      ? parsed.suggestedTitle.trim()
      : undefined;
  extractedTags = Array.isArray(parsed.extractedTags)
    ? parsed.extractedTags.filter((t): t is string => typeof t === 'string')
    : undefined;

  return {
    markdown,
    ...(suggestedTitle !== undefined ? { suggestedTitle } : {}),
    ...(extractedTags !== undefined ? { extractedTags } : {}),
  };
}

export class GeminiStructurerAdapter implements IAiStructurer {
  private readonly apiKey: string | null;

  constructor(apiKey: string | null = null) {
    this.apiKey = apiKey && apiKey.trim().length > 0 ? apiKey.trim() : null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async structureLogbook(
    entries: readonly LogbookEntry[],
    mode: LogbookMode,
    locale: SupportedLocale
  ): Promise<AiStructureResult> {
    let response: Response;
    let json: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    let rawText: string | undefined;

    if (!this.apiKey || entries.length === 0) {
      return { markdown: '' };
    }

    response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildStructuringPrompt(entries, mode, locale) }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.15,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    json = await response.json();
    rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { markdown: '' };
    }

    return parseGeminiResponse(rawText);
  }
}
