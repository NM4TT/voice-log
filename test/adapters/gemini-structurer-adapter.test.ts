import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiStructurerAdapter } from '@/adapters/ai/gemini-structurer-adapter';
import type { LogbookEntry } from '@/domain/types';

const SAMPLE_ENTRY: LogbookEntry = {
  id: 'e-1',
  createdAtIso: '2026-11-15T14:00:00.000Z',
  timestampLabel: '14:00:00',
  rawTranscript: 'Prueba de seguridad',
  cleanedText: 'Prueba de seguridad.',
  kind: 'PARAGRAPH',
  completed: false,
  chronoSeverity: 'INFO',
  standupCategory: 'PROGRESS',
  durationMs: 1200,
  hasAudio: false,
  tags: [],
};

describe('adapters/ai/gemini-structurer-adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty markdown when no API key is configured', async () => {
    const adapter = new GeminiStructurerAdapter(null);
    expect(adapter.isConfigured()).toBe(false);
    const res = await adapter.structureLogbook([SAMPLE_ENTRY], 'CHRONO_LOG', 'es');
    expect(res.markdown).toBe('');
  });

  it('sends API key strictly in x-goog-api-key header and never in URL query string', async () => {
    const adapter = new GeminiStructurerAdapter('secret-api-key');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    markdown: '## Resumen\n\n- Punto validado.',
                    suggestedTitle: 'Nota Segura',
                    extractedTags: ['seguridad'],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const res = await adapter.structureLogbook([SAMPLE_ENTRY], 'QUICK_NOTE', 'es');
    expect(res.markdown).toContain('## Resumen');
    expect(res.suggestedTitle).toBe('Nota Segura');

    const [calledUrl, calledInit] = fetchSpy.mock.calls[0]!;
    expect(String(calledUrl)).not.toContain('key=');
    expect(String(calledUrl)).not.toContain('secret-api-key');
    expect((calledInit?.headers as Record<string, string>)['x-goog-api-key']).toBe(
      'secret-api-key'
    );
  });
});
