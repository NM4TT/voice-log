import {
  DEFAULT_AUDIO_FILENAME,
  DEFAULT_MARKDOWN_FILENAME,
  MAX_EXTENSION_LENGTH,
  MAX_FILENAME_LENGTH,
  MAX_SAFE_AUDIO_BYTES,
  MAX_SAFE_TEXT_LENGTH,
} from '@/config/constants';

const DANGEROUS_CHARACTERS_REGEX = /[<>:"/\\|?*\x00-\x1F]/g;
const TRAVERSAL_REGEX = /\.\.+/g;

export function sanitizeDownloadFilename(
  rawFilename: string,
  fallback: string = DEFAULT_MARKDOWN_FILENAME
): string {
  let normalized: string;
  let withoutTraversal: string;
  let cleanName: string;
  let collapsed: string;
  let dotIdx: number;
  let ext: string;
  let baseLength: number;

  if (!rawFilename || rawFilename.trim().length === 0) {
    return fallback;
  }

  normalized = rawFilename.trim();
  withoutTraversal = normalized.replace(TRAVERSAL_REGEX, '');
  cleanName = withoutTraversal.replace(DANGEROUS_CHARACTERS_REGEX, '-');
  collapsed = cleanName
    .replace(/\s+/g, ' ')
    .replace(/(?:-\s*)+/g, '-')
    .replace(/\s*-+/g, '-')
    .replace(/-+\./g, '.')
    .replace(/^-+|-+$/g, '')
    .trim();

  if (collapsed.length === 0) {
    return fallback;
  }

  if (collapsed.length <= MAX_FILENAME_LENGTH) {
    return collapsed;
  }

  dotIdx = collapsed.lastIndexOf('.');
  if (dotIdx > 0) {
    ext = collapsed.slice(dotIdx, dotIdx + MAX_EXTENSION_LENGTH);
    baseLength = Math.max(1, MAX_FILENAME_LENGTH - ext.length);
    return collapsed.slice(0, Math.min(dotIdx, baseLength)) + ext;
  }

  return collapsed.slice(0, MAX_FILENAME_LENGTH);
}

export function resolveSafeMarkdownFilename(
  rawName: string,
  date: Date = new Date()
): string {
  const dateStr: string = date.toISOString().slice(0, 10);
  const defaultName: string = `bitacora-${dateStr}.md`;
  const trimmed: string = (rawName || '').trim();
  let hasExt: boolean;
  let nameWithExt: string;

  if (!trimmed) {
    return defaultName;
  }

  hasExt = trimmed.toLowerCase().endsWith('.md');
  nameWithExt = hasExt ? trimmed : `${trimmed}.md`;
  return sanitizeDownloadFilename(nameWithExt, defaultName);
}

export function resolveSafeAudioFilename(
  rawName: string,
  date: Date = new Date()
): string {
  const dateStr: string = date.toISOString().slice(0, 10);
  const defaultName: string = `grabacion-${dateStr}.wav`;
  const trimmed: string = (rawName || '').trim();
  let baseWithoutMd: string;
  let hasWavExt: boolean;
  let nameWithExt: string;

  if (!trimmed) {
    return defaultName;
  }

  baseWithoutMd = trimmed.replace(/\.md$/i, '');
  hasWavExt = baseWithoutMd.toLowerCase().endsWith('.wav');
  nameWithExt = hasWavExt ? baseWithoutMd : `${baseWithoutMd}.wav`;
  return sanitizeDownloadFilename(nameWithExt, DEFAULT_AUDIO_FILENAME);
}

export function validateAudioBufferByteSize(
  byteLength: number,
  maxBytes: number = MAX_SAFE_AUDIO_BYTES
): boolean {
  if (typeof byteLength !== 'number' || !Number.isFinite(byteLength)) return false;
  if (typeof maxBytes !== 'number' || !Number.isFinite(maxBytes) || maxBytes <= 0) return false;
  return byteLength >= 0 && byteLength <= maxBytes;
}

export function validateTextContentLength(
  text: string,
  maxLength: number = MAX_SAFE_TEXT_LENGTH
): boolean {
  if (typeof text !== 'string') return false;
  return text.length <= maxLength;
}

export function sanitizeYamlScalar(rawValue: string, maxLength: number = 200): string {
  if (typeof rawValue !== 'string') return '';
  return rawValue
    .replace(/[\r\n\x00-\x1F]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .trim()
    .slice(0, maxLength);
}
