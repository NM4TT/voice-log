import {
  DEFAULT_LOGBOOK_MODE,
  MAX_LOGBOOK_ENTRIES,
} from '@/config/constants';
import {
  assertNever,
  type LogbookEntry,
  type LogbookMode,
  type LogbookSession,
  type SupportedLocale,
} from '@/domain/types';

export type SessionStage =
  | 'IDLE_WELCOME'
  | 'RECORDING_BURST'
  | 'PROCESSING_AUDIO'
  | 'REVIEW_LOGBOOK';

export interface SessionFsmState {
  readonly stage: SessionStage;
  readonly session: LogbookSession;
}

export type SessionAction =
  | { readonly type: 'SELECT_MODE'; readonly mode: LogbookMode }
  | { readonly type: 'SET_TITLE'; readonly title: string }
  | { readonly type: 'START_RECORDING' }
  | { readonly type: 'CANCEL_RECORDING' }
  | { readonly type: 'FINISH_RECORDING_RAW' }
  | { readonly type: 'APPEND_ENTRIES'; readonly entries: readonly LogbookEntry[] }
  | { readonly type: 'UPDATE_ENTRY'; readonly entryId: string; readonly patch: Partial<LogbookEntry> }
  | { readonly type: 'DELETE_ENTRY'; readonly entryId: string }
  | { readonly type: 'MOVE_ENTRY'; readonly entryId: string; readonly direction: 'UP' | 'DOWN' }
  | { readonly type: 'TOGGLE_FRONTMATTER' }
  | { readonly type: 'TOGGLE_CLEAN_FILLERS' }
  | { readonly type: 'SET_TAGS'; readonly tags: readonly string[] }
  | { readonly type: 'SET_AI_MARKDOWN'; readonly markdown: string | null }
  | { readonly type: 'SET_LOCALE'; readonly locale: SupportedLocale }
  | { readonly type: 'RESET_SESSION'; readonly locale: SupportedLocale };

const DEFAULT_TITLE_ES = 'Bitácora de sesión';
const DEFAULT_TITLE_EN = 'Session logbook';

export function createInitialSessionState(
  locale: SupportedLocale = 'es',
  mode: LogbookMode = DEFAULT_LOGBOOK_MODE
): SessionFsmState {
  const nowIso = new Date().toISOString();
  const defaultTitle = locale === 'es' ? DEFAULT_TITLE_ES : DEFAULT_TITLE_EN;

  return {
    stage: 'IDLE_WELCOME',
    session: {
      sessionId: `vl-${Date.now()}`,
      title: defaultTitle,
      mode,
      locale,
      createdAtIso: nowIso,
      includeFrontmatter: true,
      cleanFillers: true,
      tags: ['bitacora'],
      entries: [],
      aiPolishedMarkdown: null,
    },
  };
}

function reorderEntries(
  entries: readonly LogbookEntry[],
  entryId: string,
  direction: 'UP' | 'DOWN'
): readonly LogbookEntry[] {
  const list = [...entries];
  const index = list.findIndex((e) => e.id === entryId);
  const targetIndex = direction === 'UP' ? index - 1 : index + 1;
  let temp: LogbookEntry | undefined;

  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) {
    return entries;
  }

  temp = list[index];
  if (temp && list[targetIndex]) {
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
  }
  return Object.freeze(list);
}

function applyEntryMutation(
  state: SessionFsmState,
  action: Extract<SessionAction, { type: 'APPEND_ENTRIES' | 'UPDATE_ENTRY' | 'DELETE_ENTRY' | 'MOVE_ENTRY' }>
): SessionFsmState {
  let nextEntries: readonly LogbookEntry[];

  switch (action.type) {
    case 'APPEND_ENTRIES':
      nextEntries = [...state.session.entries, ...action.entries].slice(0, MAX_LOGBOOK_ENTRIES);
      return {
        stage: nextEntries.length > 0 ? 'REVIEW_LOGBOOK' : 'IDLE_WELCOME',
        session: { ...state.session, entries: nextEntries, aiPolishedMarkdown: null },
      };
    case 'UPDATE_ENTRY':
      nextEntries = state.session.entries.map((entry) =>
        entry.id === action.entryId ? { ...entry, ...action.patch } : entry
      );
      return { ...state, session: { ...state.session, entries: nextEntries, aiPolishedMarkdown: null } };
    case 'DELETE_ENTRY':
      nextEntries = state.session.entries.filter((entry) => entry.id !== action.entryId);
      return {
        stage: nextEntries.length === 0 ? 'IDLE_WELCOME' : state.stage,
        session: { ...state.session, entries: nextEntries, aiPolishedMarkdown: null },
      };
    case 'MOVE_ENTRY':
      nextEntries = reorderEntries(state.session.entries, action.entryId, action.direction);
      return { ...state, session: { ...state.session, entries: nextEntries, aiPolishedMarkdown: null } };
    default:
      return assertNever(action);
  }
}

function resolveTitleForLocaleChange(currentTitle: string, nextLocale: SupportedLocale): string {
  const isDefaultTitle =
    currentTitle === DEFAULT_TITLE_ES || currentTitle === DEFAULT_TITLE_EN;
  if (!isDefaultTitle) {
    return currentTitle;
  }
  return nextLocale === 'es' ? DEFAULT_TITLE_ES : DEFAULT_TITLE_EN;
}

export function transitionSessionState(
  state: SessionFsmState,
  action: SessionAction
): SessionFsmState {
  switch (action.type) {
    case 'SELECT_MODE':
      return { ...state, session: { ...state.session, mode: action.mode } };
    case 'SET_TITLE':
      return { ...state, session: { ...state.session, title: action.title } };
    case 'START_RECORDING':
      return { ...state, stage: 'RECORDING_BURST' };
    case 'CANCEL_RECORDING':
      return {
        ...state,
        stage: state.session.entries.length > 0 ? 'REVIEW_LOGBOOK' : 'IDLE_WELCOME',
      };
    case 'FINISH_RECORDING_RAW':
      return { ...state, stage: 'PROCESSING_AUDIO' };
    case 'APPEND_ENTRIES':
    case 'UPDATE_ENTRY':
    case 'DELETE_ENTRY':
    case 'MOVE_ENTRY':
      return applyEntryMutation(state, action);
    case 'TOGGLE_FRONTMATTER':
      return {
        ...state,
        session: { ...state.session, includeFrontmatter: !state.session.includeFrontmatter },
      };
    case 'TOGGLE_CLEAN_FILLERS':
      return {
        ...state,
        session: { ...state.session, cleanFillers: !state.session.cleanFillers },
      };
    case 'SET_TAGS':
      return { ...state, session: { ...state.session, tags: action.tags } };
    case 'SET_AI_MARKDOWN':
      return { ...state, session: { ...state.session, aiPolishedMarkdown: action.markdown } };
    case 'SET_LOCALE':
      return {
        ...state,
        session: {
          ...state.session,
          locale: action.locale,
          title: resolveTitleForLocaleChange(state.session.title, action.locale),
        },
      };
    case 'RESET_SESSION':
      return createInitialSessionState(action.locale, state.session.mode);
    default:
      return assertNever(action);
  }
}
