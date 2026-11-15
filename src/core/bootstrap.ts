export interface BrowserCapabilities {
  readonly hasWorker: boolean;
  readonly hasIndexedDb: boolean;
  readonly hasMediaDevices: boolean;
  readonly hasSpeechRecognition: boolean;
  readonly hasAudioContext: boolean;
}

export interface BootstrapResult {
  readonly isReady: boolean;
  readonly capabilities: BrowserCapabilities;
  readonly warnings: readonly string[];
}

export function validateBrowserCapabilities(): BrowserCapabilities {
  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
  const hasWorker = typeof Worker !== 'undefined';
  const hasIndexedDb = typeof indexedDB !== 'undefined';
  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';
  const hasSpeechRecognition =
    typeof win.SpeechRecognition === 'function' ||
    typeof win.webkitSpeechRecognition === 'function';
  const hasAudioContext =
    typeof win.AudioContext === 'function' ||
    typeof win.webkitAudioContext === 'function';

  return Object.freeze({
    hasWorker,
    hasIndexedDb,
    hasMediaDevices,
    hasSpeechRecognition,
    hasAudioContext,
  });
}

export async function bootstrapApplication(): Promise<BootstrapResult> {
  const capabilities = validateBrowserCapabilities();
  const warnings: string[] = [];

  if (!capabilities.hasMediaDevices) {
    warnings.push('Micrófono no detectado o contexto no seguro (requiere HTTPS o localhost).');
  }
  if (!capabilities.hasSpeechRecognition && capabilities.hasWorker) {
    warnings.push('Web Speech API no disponible; se usará el motor Whisper en Web Worker.');
  }
  if (!capabilities.hasIndexedDb) {
    warnings.push('IndexedDB no disponible; la sesión se mantendrá en memoria RAM.');
  }

  return Object.freeze({
    isReady: true,
    capabilities,
    warnings: Object.freeze(warnings),
  });
}
