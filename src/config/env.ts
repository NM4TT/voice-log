export interface EnvironmentConfig {
  readonly geminiApiKey: string | null;
  readonly publicRepoUrl: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

const DEFAULT_GEMINI_API_KEY: string | null = null;
const DEFAULT_PUBLIC_REPO_URL = 'https://github.com/NM4TT/voice-log';

export function loadEnvironmentConfig(): EnvironmentConfig {
  const rawKey: unknown = import.meta.env.VITE_GEMINI_API_KEY;
  const rawRepo: unknown = import.meta.env.PUBLIC_REPO ?? import.meta.env.VITE_PUBLIC_REPO;
  const mode: string = import.meta.env.MODE ?? 'development';

  const validatedKey: string | null =
    typeof rawKey === 'string' && rawKey.trim().length > 0
      ? rawKey.trim()
      : DEFAULT_GEMINI_API_KEY;

  const validatedRepo: string =
    typeof rawRepo === 'string' && rawRepo.trim().length > 0
      ? rawRepo.trim()
      : DEFAULT_PUBLIC_REPO_URL;

  return Object.freeze({
    geminiApiKey: validatedKey,
    publicRepoUrl: validatedRepo,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
  });
}

export const ENV: EnvironmentConfig = loadEnvironmentConfig();
