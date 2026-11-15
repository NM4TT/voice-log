import { describe, it, expect } from 'vitest';
import {
  createInitialSessionState,
  transitionSessionState,
} from '@/ui/fsm/session-fsm';
import type { LogbookEntry } from '@/domain/types';

const MOCK_ENTRY: LogbookEntry = {
  id: 'entry-1',
  createdAtIso: '2026-11-15T14:00:00.000Z',
  timestampLabel: '14:00:00',
  rawTranscript: 'Prueba de bloque',
  cleanedText: 'Prueba de bloque.',
  kind: 'PARAGRAPH',
  completed: false,
  chronoSeverity: 'INFO',
  standupCategory: 'PROGRESS',
  durationMs: 2500,
  hasAudio: true,
  tags: [],
};

describe('ui/fsm/session-fsm', () => {
  it('transitions from IDLE_WELCOME through RECORDING_BURST to REVIEW_LOGBOOK', () => {
    const initial = createInitialSessionState('es');
    expect(initial.stage).toBe('IDLE_WELCOME');

    const recording = transitionSessionState(initial, { type: 'START_RECORDING' });
    expect(recording.stage).toBe('RECORDING_BURST');

    const processing = transitionSessionState(recording, { type: 'FINISH_RECORDING_RAW' });
    expect(processing.stage).toBe('PROCESSING_AUDIO');

    const reviewing = transitionSessionState(processing, {
      type: 'APPEND_ENTRIES',
      entries: [MOCK_ENTRY],
    });
    expect(reviewing.stage).toBe('REVIEW_LOGBOOK');
    expect(reviewing.session.entries).toHaveLength(1);
  });

  it('updates, reorders, and deletes entries deterministically', () => {
    const stateWithTwo = transitionSessionState(createInitialSessionState('es'), {
      type: 'APPEND_ENTRIES',
      entries: [
        MOCK_ENTRY,
        { ...MOCK_ENTRY, id: 'entry-2', cleanedText: 'Segundo bloque.' },
      ],
    });

    const moved = transitionSessionState(stateWithTwo, {
      type: 'MOVE_ENTRY',
      entryId: 'entry-2',
      direction: 'UP',
    });
    expect(moved.session.entries[0]?.id).toBe('entry-2');

    const updated = transitionSessionState(moved, {
      type: 'UPDATE_ENTRY',
      entryId: 'entry-2',
      patch: { completed: true },
    });
    expect(updated.session.entries[0]?.completed).toBe(true);

    const afterDelete = transitionSessionState(updated, {
      type: 'DELETE_ENTRY',
      entryId: 'entry-2',
    });
    expect(afterDelete.session.entries).toHaveLength(1);
    expect(afterDelete.session.entries[0]?.id).toBe('entry-1');
  });

  it('updates default session title when switching locale and preserves custom title', () => {
    const initialEs = createInitialSessionState('es');
    expect(initialEs.session.title).toBe('Bitácora de sesión');

    const switchedToEn = transitionSessionState(initialEs, {
      type: 'SET_LOCALE',
      locale: 'en',
    });
    expect(switchedToEn.session.title).toBe('Session logbook');

    const customized = transitionSessionState(switchedToEn, {
      type: 'SET_TITLE',
      title: 'Mi Incidente Crítico',
    });
    const switchedBackToEs = transitionSessionState(customized, {
      type: 'SET_LOCALE',
      locale: 'es',
    });
    expect(switchedBackToEs.session.title).toBe('Mi Incidente Crítico');
  });
});
