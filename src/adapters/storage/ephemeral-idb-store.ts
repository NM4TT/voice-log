import { IDB_CONFIG } from '@/config/constants';
import { validateAudioBufferByteSize } from '@/core/security';
import type { IEphemeralSessionStore } from '@/domain/ports';
import type { LogbookEntry } from '@/domain/types';

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(IDB_CONFIG.DB_NAME, IDB_CONFIG.DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_CONFIG.ENTRIES_STORE)) {
        db.createObjectStore(IDB_CONFIG.ENTRIES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IDB_CONFIG.AUDIO_STORE)) {
        db.createObjectStore(IDB_CONFIG.AUDIO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function runTransaction(
  db: IDBDatabase,
  storeNames: string[],
  mode: IDBTransactionMode,
  operation: (tx: IDBTransaction) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    operation(tx);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB transaction error'));
  });
}

export class EphemeralIdbStore implements IEphemeralSessionStore {
  private readonly memoryEntries = new Map<string, LogbookEntry>();
  private readonly memoryAudio = new Map<string, Blob>();

  async saveEntry(entry: LogbookEntry, audioBlob?: Blob): Promise<void> {
    const db = await openDatabase();
    const validBlob =
      audioBlob && validateAudioBufferByteSize(audioBlob.size) ? audioBlob : undefined;

    this.memoryEntries.set(entry.id, entry);
    if (validBlob) {
      this.memoryAudio.set(entry.id, validBlob);
    }

    if (!db) return;
    await runTransaction(
      db,
      [IDB_CONFIG.ENTRIES_STORE, IDB_CONFIG.AUDIO_STORE],
      'readwrite',
      (tx) => {
        tx.objectStore(IDB_CONFIG.ENTRIES_STORE).put(entry);
        if (validBlob) {
          tx.objectStore(IDB_CONFIG.AUDIO_STORE).put(validBlob, entry.id);
        }
      }
    );
    db.close();
  }

  async getEntries(): Promise<readonly LogbookEntry[]> {
    const db = await openDatabase();
    if (!db) {
      return Array.from(this.memoryEntries.values());
    }

    return new Promise((resolve) => {
      const tx = db.transaction([IDB_CONFIG.ENTRIES_STORE], 'readonly');
      const req = tx.objectStore(IDB_CONFIG.ENTRIES_STORE).getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as LogbookEntry[]) ?? []);
      };
      req.onerror = () => {
        db.close();
        resolve(Array.from(this.memoryEntries.values()));
      };
    });
  }

  async getAudioBlob(entryId: string): Promise<Blob | null> {
    const memBlob = this.memoryAudio.get(entryId);
    const db = await openDatabase();
    if (memBlob) return memBlob;
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction([IDB_CONFIG.AUDIO_STORE], 'readonly');
      const req = tx.objectStore(IDB_CONFIG.AUDIO_STORE).get(entryId);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as Blob | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  }

  async deleteEntry(entryId: string): Promise<void> {
    const db = await openDatabase();
    this.memoryEntries.delete(entryId);
    this.memoryAudio.delete(entryId);
    if (!db) return;

    await runTransaction(
      db,
      [IDB_CONFIG.ENTRIES_STORE, IDB_CONFIG.AUDIO_STORE],
      'readwrite',
      (tx) => {
        tx.objectStore(IDB_CONFIG.ENTRIES_STORE).delete(entryId);
        tx.objectStore(IDB_CONFIG.AUDIO_STORE).delete(entryId);
      }
    );
    db.close();
  }

  async clearAll(): Promise<void> {
    const db = await openDatabase();
    this.memoryEntries.clear();
    this.memoryAudio.clear();
    if (!db) return;

    await runTransaction(
      db,
      [IDB_CONFIG.ENTRIES_STORE, IDB_CONFIG.AUDIO_STORE],
      'readwrite',
      (tx) => {
        tx.objectStore(IDB_CONFIG.ENTRIES_STORE).clear();
        tx.objectStore(IDB_CONFIG.AUDIO_STORE).clear();
      }
    );
    db.close();
  }
}
