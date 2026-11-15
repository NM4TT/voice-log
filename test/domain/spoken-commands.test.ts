import { describe, it, expect } from 'vitest';
import { parseSpokenMarkdownSegments } from '@/domain/markdown/spoken-commands';

describe('domain/markdown/spoken-commands', () => {
  it('detects Spanish spoken commands for headings, tasks, and callouts', () => {
    const input = 'título Revisión de arquitectura. tarea pendiente actualizar dependencias de vite. nota importante validar memoria en el worker';
    const segments = parseSpokenMarkdownSegments(input, 'es');

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({
      kind: 'HEADING',
      content: 'Revisión de arquitectura',
    });
    expect(segments[1]).toEqual({
      kind: 'TASK_ITEM',
      content: 'Actualizar dependencias de vite.',
    });
    expect(segments[2]).toEqual({
      kind: 'CALLOUT_IMPORTANT',
      content: 'Validar memoria en el worker.',
    });
  });

  it('detects English spoken commands for todo items and headings', () => {
    const input = 'heading Deployment checklist. todo item verify nginx headers';
    const segments = parseSpokenMarkdownSegments(input, 'en');

    expect(segments).toHaveLength(2);
    expect(segments[0]?.kind).toBe('HEADING');
    expect(segments[1]?.kind).toBe('TASK_ITEM');
  });

  it('defaults to PARAGRAPH when no structural command is spoken', () => {
    const segments = parseSpokenMarkdownSegments('El servicio respondió en 12 milisegundos', 'es');
    expect(segments).toEqual([
      {
        kind: 'PARAGRAPH',
        content: 'El servicio respondió en 12 milisegundos.',
      },
    ]);
  });

  it('splits continuous unpunctuated speech when inline spoken commands appear', () => {
    const input =
      'nuevo título Arquitectura general tarea pendiente revisar adaptadores nota importante validar worker';
    const segments = parseSpokenMarkdownSegments(input, 'es');

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({
      kind: 'HEADING',
      content: 'Arquitectura general',
    });
    expect(segments[1]).toEqual({
      kind: 'TASK_ITEM',
      content: 'Revisar adaptadores.',
    });
    expect(segments[2]).toEqual({
      kind: 'CALLOUT_IMPORTANT',
      content: 'Validar worker.',
    });
  });

  it('preserves verbal fillers when cleanFillers is set to false', () => {
    const input = 'eh bueno necesitamos revisar el módulo';
    const cleaned = parseSpokenMarkdownSegments(input, 'es', true);
    const preserved = parseSpokenMarkdownSegments(input, 'es', false);

    expect(cleaned[0]?.content).toBe('Necesitamos revisar el módulo.');
    expect(preserved[0]?.content).toBe('Eh bueno necesitamos revisar el módulo.');
  });
});
