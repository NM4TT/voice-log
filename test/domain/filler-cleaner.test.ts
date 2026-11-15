import { describe, it, expect } from 'vitest';
import { cleanSpokenTranscript } from '@/domain/markdown/filler-cleaner';

describe('domain/markdown/filler-cleaner', () => {
  it('removes common Spanish verbal fillers and normalizes punctuation', () => {
    const raw = 'ehh bueno revisamos el servidor y este vimos que el puerto 8080 estaba cerrado';
    const cleaned = cleanSpokenTranscript(raw, 'es', true);
    expect(cleaned).toBe('Revisamos el servidor y vimos que el puerto 8080 estaba cerrado.');
  });

  it('removes common English verbal fillers and capitalizes sentence start', () => {
    const raw = 'um uh we need to deploy the hotfix to production right now';
    const cleaned = cleanSpokenTranscript(raw, 'en', true);
    expect(cleaned).toBe('We need to deploy the hotfix to production right now.');
  });

  it('preserves fillers when cleanFillers is disabled but still normalizes spacing and period', () => {
    const raw = '  probando   el sistema de audio  ';
    const cleaned = cleanSpokenTranscript(raw, 'es', false);
    expect(cleaned).toBe('Probando el sistema de audio.');
  });

  it('preserves legitimate Spanish demonstratives and adjectives like este and bueno in context', () => {
    const raw = 'en este proyecto debemos revisar este módulo porque el resultado es bueno';
    const cleaned = cleanSpokenTranscript(raw, 'es', true);
    expect(cleaned).toBe(
      'En este proyecto debemos revisar este módulo porque el resultado es bueno.'
    );
  });
});
