import {
  resolveSafeAudioFilename,
  resolveSafeMarkdownFilename,
  validateTextContentLength,
} from '@/core/security';

export function downloadMarkdownFile(markdownContent: string, rawTitle: string): string {
  const filename = resolveSafeMarkdownFilename(rawTitle);
  let blob: Blob;
  let url: string;
  let anchor: HTMLAnchorElement;

  if (!validateTextContentLength(markdownContent)) {
    throw new Error('Markdown content exceeds safe size limit');
  }

  blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  url = URL.createObjectURL(blob);
  anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return filename;
}

export function downloadAudioBlob(audioBlob: Blob, rawLabel: string): string {
  const filename = resolveSafeAudioFilename(rawLabel);
  const url = URL.createObjectURL(audioBlob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return filename;
}

export async function copyMarkdownToClipboard(markdownContent: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(markdownContent);
    return true;
  } catch {
    return false;
  }
}

export async function shareMarkdownNative(
  markdownContent: string,
  rawTitle: string
): Promise<boolean> {
  const filename = resolveSafeMarkdownFilename(rawTitle);
  let file: File;

  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }

  try {
    file = new File([markdownContent], filename, { type: 'text/markdown' });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: rawTitle,
        text: markdownContent,
        files: [file],
      });
      return true;
    }
    await navigator.share({
      title: rawTitle,
      text: markdownContent,
    });
    return true;
  } catch {
    return false;
  }
}
