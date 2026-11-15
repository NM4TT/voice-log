import { sanitizeYamlScalar } from '@/core/security';
import {
  assertNever,
  type LogbookEntry,
  type LogbookSession,
  type StandupCategory,
  type SupportedLocale,
} from '@/domain/types';

export interface SessionMetrics {
  readonly entryCount: number;
  readonly wordCount: number;
  readonly totalDurationMs: number;
}

export function computeSessionMetrics(entries: readonly LogbookEntry[]): SessionMetrics {
  let wordCount = 0;
  let totalDurationMs = 0;
  let i = 0;
  let entry: LogbookEntry | undefined;
  let words: string[];

  for (i = 0; i < entries.length; i += 1) {
    entry = entries[i];
    if (entry) {
      totalDurationMs += entry.durationMs;
      words = entry.cleanedText.trim().split(/\s+/).filter(Boolean);
      wordCount += words.length;
    }
  }

  return Object.freeze({
    entryCount: entries.length,
    wordCount,
    totalDurationMs,
  });
}

function buildYamlFrontmatter(session: LogbookSession, metrics: SessionMetrics): string {
  const safeTitle = sanitizeYamlScalar(session.title, 140);
  const dateOnly = sanitizeYamlScalar(session.createdAtIso.slice(0, 10), 16);
  const safeCreatedAt = sanitizeYamlScalar(session.createdAtIso, 40);
  const durationSec = Math.round(metrics.totalDurationMs / 1000);
  const tagsList = session.tags.map((t) => `"${sanitizeYamlScalar(t, 40)}"`).join(', ');

  return [
    '---',
    `title: "${safeTitle}"`,
    `date: "${dateOnly}"`,
    `created_at: "${safeCreatedAt}"`,
    `mode: "${session.mode}"`,
    `entries: ${metrics.entryCount}`,
    `words: ${metrics.wordCount}`,
    `duration_seconds: ${durationSec}`,
    `tags: [${tagsList}]`,
    '---',
    '',
  ].join('\n');
}

function renderEntryNode(entry: LogbookEntry): string {
  const checkbox = entry.completed ? '[x]' : '[ ]';
  switch (entry.kind) {
    case 'HEADING':
      return `## ${entry.cleanedText.replace(/[.]+$/, '')}`;
    case 'TASK_ITEM':
      return `- ${checkbox} ${entry.cleanedText}`;
    case 'CALLOUT_NOTE':
      return `> [!NOTE]\n> ${entry.cleanedText}`;
    case 'CALLOUT_IMPORTANT':
      return `> [!IMPORTANT]\n> ${entry.cleanedText}`;
    case 'CODE_BLOCK':
      return `\`\`\`text\n${entry.cleanedText}\n\`\`\``;
    case 'PARAGRAPH':
      return entry.cleanedText;
    default:
      return assertNever(entry.kind);
  }
}

function renderChronoLogBody(entries: readonly LogbookEntry[]): string {
  return entries
    .map((entry) => {
      const header = `### [${entry.timestampLabel}] [${entry.chronoSeverity}]`;
      const body = renderEntryNode(entry);
      return `${header}\n\n${body}`;
    })
    .join('\n\n');
}

function renderActionItemsBody(entries: readonly LogbookEntry[]): string {
  return entries
    .map((entry) => {
      const checkbox = entry.completed ? '[x]' : '[ ]';
      return `- ${checkbox} ${entry.cleanedText}`;
    })
    .join('\n');
}

function getStandupHeading(category: StandupCategory, locale: SupportedLocale): string {
  switch (category) {
    case 'PROGRESS':
      return locale === 'es' ? '## Avances' : '## Progress';
    case 'NEXT_STEPS':
      return locale === 'es' ? '## Próximos pasos' : '## Next steps';
    case 'BLOCKERS':
      return locale === 'es' ? '## Bloqueos' : '## Blockers';
    default:
      return assertNever(category);
  }
}

function renderStandupBody(entries: readonly LogbookEntry[], locale: SupportedLocale): string {
  const categories: readonly StandupCategory[] = ['PROGRESS', 'NEXT_STEPS', 'BLOCKERS'];
  const sections: string[] = [];
  let i = 0;
  let cat: StandupCategory | undefined;
  let matching: LogbookEntry[];

  for (i = 0; i < categories.length; i += 1) {
    cat = categories[i];
    if (cat) {
      matching = entries.filter((e) => e.standupCategory === cat);
      if (matching.length > 0) {
        sections.push(
          `${getStandupHeading(cat, locale)}\n\n${matching.map((e) => `- ${e.cleanedText}`).join('\n')}`
        );
      }
    }
  }
  return sections.join('\n\n');
}

export function compileSessionToMarkdown(session: LogbookSession): string {
  const metrics = computeSessionMetrics(session.entries);
  const frontmatter = session.includeFrontmatter
    ? buildYamlFrontmatter(session, metrics)
    : '';
  const heading = `# ${session.title}\n\n`;
  let body: string;

  if (session.aiPolishedMarkdown && session.aiPolishedMarkdown.trim().length > 0) {
    return `${frontmatter}${session.aiPolishedMarkdown.trim()}\n`;
  }

  switch (session.mode) {
    case 'CHRONO_LOG':
      body = renderChronoLogBody(session.entries);
      break;
    case 'QUICK_NOTE':
      body = session.entries.map(renderEntryNode).join('\n\n');
      break;
    case 'ACTION_ITEMS':
      body = renderActionItemsBody(session.entries);
      break;
    case 'DAILY_STANDUP':
      body = renderStandupBody(session.entries, session.locale);
      break;
    default:
      return assertNever(session.mode);
  }

  return `${frontmatter}${heading}${body}\n`;
}
