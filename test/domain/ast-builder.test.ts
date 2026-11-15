import { describe, it, expect } from 'vitest';
import { compileSessionToMarkdown, computeSessionMetrics } from '@/domain/markdown/ast-builder';
import type { LogbookEntry, LogbookSession } from '@/domain/types';

const SAMPLE_ENTRIES: readonly LogbookEntry[] = [
  {
    id: 'e-1',
    createdAtIso: '2026-11-15T14:00:00.000Z',
    timestampLabel: '14:00:00',
    rawTranscript: 'Se detectó latencia alta en el nodo primario',
    cleanedText: 'Se detectó latencia alta en el nodo primario.',
    kind: 'PARAGRAPH',
    completed: false,
    chronoSeverity: 'WARN',
    standupCategory: 'PROGRESS',
    durationMs: 4500,
    hasAudio: true,
    tags: ['infra'],
  },
  {
    id: 'e-2',
    createdAtIso: '2026-11-15T14:05:10.000Z',
    timestampLabel: '14:05:10',
    rawTranscript: 'Reiniciar el pool de conexiones',
    cleanedText: 'Reiniciar el pool de conexiones.',
    kind: 'TASK_ITEM',
    completed: true,
    chronoSeverity: 'FIX',
    standupCategory: 'NEXT_STEPS',
    durationMs: 3200,
    hasAudio: true,
    tags: ['db'],
  },
];

function createSession(mode: LogbookSession['mode'], includeFrontmatter = true): LogbookSession {
  return {
    sessionId: 'sess-01',
    title: 'Bitácora de Incidente DB',
    mode,
    locale: 'es',
    createdAtIso: '2026-11-15T14:00:00.000Z',
    includeFrontmatter,
    cleanFillers: true,
    tags: ['produccion', 'incidente'],
    entries: SAMPLE_ENTRIES,
    aiPolishedMarkdown: null,
  };
}

describe('domain/markdown/ast-builder', () => {
  it('compiles CHRONO_LOG with YAML frontmatter, timestamps, and severity tags', () => {
    const md = compileSessionToMarkdown(createSession('CHRONO_LOG', true));
    expect(md).toContain('---');
    expect(md).toContain('title: "Bitácora de Incidente DB"');
    expect(md).toContain('mode: "CHRONO_LOG"');
    expect(md).toContain('### [14:00:00] [WARN]');
    expect(md).toContain('- [x] Reiniciar el pool de conexiones.');
  });

  it('compiles ACTION_ITEMS as an interactive checklist without frontmatter when disabled', () => {
    const md = compileSessionToMarkdown(createSession('ACTION_ITEMS', false));
    expect(md.startsWith('---')).toBe(false);
    expect(md).toContain('# Bitácora de Incidente DB');
    expect(md).toContain('- [ ] Se detectó latencia alta en el nodo primario.');
    expect(md).toContain('- [x] Reiniciar el pool de conexiones.');
  });

  it('compiles DAILY_STANDUP grouped by Progress, Next Steps, and Blockers', () => {
    const md = compileSessionToMarkdown(createSession('DAILY_STANDUP', false));
    expect(md).toContain('## Avances');
    expect(md).toContain('## Próximos pasos');
    expect(md).toContain('Se detectó latencia alta en el nodo primario.');
    expect(md).toContain('Reiniciar el pool de conexiones.');
  });

  it('computes accurate session metrics (word count, duration, entry count)', () => {
    const metrics = computeSessionMetrics(SAMPLE_ENTRIES);
    expect(metrics.entryCount).toBe(2);
    expect(metrics.totalDurationMs).toBe(7700);
    expect(metrics.wordCount).toBe(13);
  });
});
