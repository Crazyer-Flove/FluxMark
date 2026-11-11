export interface Draft {
  id: string;
  documentId: string;
  name: string;
  html: string;
  time: number;
}

const legacyKey = 'fluxmark_draft_history_v1';
const emergencyKey = 'fluxmark_working_emergency_v1';
let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  if (database) return database;
  database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('fluxmark-drafts', 1);
    request.onupgradeneeded = () => {
      const versions = request.result.createObjectStore('versions', { keyPath: 'id' });
      request.result.createObjectStore('working', { keyPath: 'id' });
      try {
        const previous: Omit<Draft, 'documentId'>[] = JSON.parse(localStorage.getItem(legacyKey) || '[]');
        for (const draft of previous) {
          if (draft.id && typeof draft.html === 'string') {
            versions.put({ ...draft, documentId: 'legacy:' + draft.name });
          }
        }
      } catch { /* Ignore malformed legacy records. */ }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}

export async function listDrafts(): Promise<Draft[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('versions').objectStore('versions').getAll();
    request.onsuccess = () => resolve((request.result as Draft[]).sort((a, b) => b.time - a.time));
    request.onerror = () => reject(request.error);
  });
}

export async function storeDraft(documentId: string, name: string, html: string) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('versions', 'readwrite');
    const versions = tx.objectStore('versions');
    const request = versions.getAll();
    request.onsuccess = () => {
      const recent = (request.result as Draft[]).sort((a, b) => b.time - a.time);
      if (recent.find(draft => draft.documentId === documentId)?.html === html) return;
      versions.put({ id: crypto.randomUUID(), documentId, name, html, time: Date.now() });
      recent.slice(29).forEach(draft => versions.delete(draft.id));
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  window.dispatchEvent(new Event('fluxmark-drafts-changed'));
}

export function saveEmergencyDraft(draft: Omit<Draft, 'id'>) {
  try { localStorage.setItem(emergencyKey, JSON.stringify({...draft, id: 'current'})); }
  catch { /* Async storage is still attempted by the caller. */ }
}

export async function saveWorkingDraft(draft: Omit<Draft, 'id'>) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('working', 'readwrite');
    tx.objectStore('working').put({ ...draft, id: 'current' });
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
}

export async function readWorkingDraft(): Promise<Draft | undefined> {
  let emergency: Draft | undefined;
  try {
    const saved = JSON.parse(localStorage.getItem(emergencyKey) || 'null');
    if (saved && typeof saved.html === 'string' && typeof saved.documentId === 'string' && typeof saved.time === 'number') emergency = saved;
  } catch { /* Continue with the async store. */ }
  try {
    const db = await openDatabase();
    const cached = await new Promise<Draft | undefined>((resolve, reject) => {
      const request = db.transaction('working').objectStore('working').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (emergency && emergency.time > (cached?.time ?? 0)) return emergency;
    if (emergency) {
      try {
        const current = JSON.parse(localStorage.getItem(emergencyKey) || 'null');
        if (current?.time === emergency.time) localStorage.removeItem(emergencyKey);
      } catch { /* A later load can retry cleanup. */ }
    }
    return cached;
  } catch (error) {
    if (emergency) return emergency;
    throw error;
  }
}
