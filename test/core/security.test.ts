import { describe, it, expect } from 'vitest';
import {
  sanitizeDownloadFilename,
  resolveSafeMarkdownFilename,
  resolveSafeAudioFilename,
  validateAudioBufferByteSize,
  validateTextContentLength,
  sanitizeYamlScalar,
} from '@/core/security';

describe('core/security', () => {
  it('sanitizes dangerous path traversal and special characters', () => {
    expect(sanitizeDownloadFilename('../../etc/passwd')).toBe('etc-passwd');
    expect(sanitizeDownloadFilename('nota: importante? <hoy>.md')).toBe('nota-importante-hoy.md');
    expect(sanitizeDownloadFilename('   ')).toBe('bitacora.md');
  });

  it('resolves safe markdown filenames with date fallback', () => {
    const fixedDate = new Date('2026-11-15T12:00:00Z');
    expect(resolveSafeMarkdownFilename('', fixedDate)).toBe('bitacora-2026-11-15.md');
    expect(resolveSafeMarkdownFilename('Incidente API', fixedDate)).toBe('Incidente API.md');
    expect(resolveSafeMarkdownFilename('notas.md', fixedDate)).toBe('notas.md');
  });

  it('resolves safe wav audio filenames', () => {
    const fixedDate = new Date('2026-11-15T12:00:00Z');
    expect(resolveSafeAudioFilename('bloque-1', fixedDate)).toBe('bloque-1.wav');
    expect(resolveSafeAudioFilename('', fixedDate)).toBe('grabacion-2026-11-15.wav');
  });

  it('validates audio buffer byte sizes and text length limits', () => {
    expect(validateAudioBufferByteSize(1024)).toBe(true);
    expect(validateAudioBufferByteSize(-1)).toBe(false);
    expect(validateAudioBufferByteSize(100 * 1024 * 1024)).toBe(false);
    expect(validateTextContentLength('Hola mundo')).toBe(true);
    expect(validateTextContentLength('x'.repeat(200000))).toBe(false);
  });

  it('prevents YAML frontmatter newline and quote injection in scalars', () => {
    const malicious = 'Mi Nota"\n---\nscript: "evil\r\n\\test';
    const sanitized = sanitizeYamlScalar(malicious);
    expect(sanitized).not.toContain('\n');
    expect(sanitized).not.toContain('\r');
    expect(sanitized).toBe('Mi Nota\\" --- script: \\"evil \\\\test');
  });
});
