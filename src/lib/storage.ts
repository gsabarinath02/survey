// Session storage and recovery utilities
// Uses localStorage and IndexedDB for offline support

const STORAGE_KEY = 'nurse_survey_progress';
const DB_NAME = 'NurseSurveyDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingResponses';

export interface SavedProgress {
    sessionId: string;
    role: 'nurse' | 'doctor';
    currentIndex: number;
    answers: Record<string, unknown>;
    language: string;
    startTime: number;
    lastUpdated: number;
}

export interface PendingResponse {
    id: string;
    sessionId: string;
    questionId: string;
    value: unknown;
    timestamp: number;
    synced: boolean;
}

// LocalStorage operations for progress saving
export function saveProgress(progress: SavedProgress): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Failed to save progress to localStorage:', error);
    }
}

export function loadProgress(): SavedProgress | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        const progress = JSON.parse(saved) as SavedProgress;

        // Check if progress is less than 24 hours old
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - progress.lastUpdated > maxAge) {
            clearProgress();
            return null;
        }

        return progress;
    } catch {
        return null;
    }
}

export function clearProgress(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore errors
    }
}

// IndexedDB operations for offline response queuing
let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('sessionId', 'sessionId', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
            }
        };
    });
}

export async function queueResponse(response: Omit<PendingResponse, 'id' | 'synced'>): Promise<void> {
    try {
        const database = await openDB();
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const pendingResponse: PendingResponse = {
            ...response,
            id: `${response.sessionId}_${response.questionId}_${response.timestamp}`,
            synced: false
        };

        await new Promise<void>((resolve, reject) => {
            const request = store.put(pendingResponse);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to queue response:', error);
    }
}

export async function getPendingResponses(): Promise<PendingResponse[]> {
    try {
        const database = await openDB();
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('synced');

        return new Promise((resolve, reject) => {
            const request = index.getAll(IDBKeyRange.only(false));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return [];
    }
}

export async function markResponseSynced(id: string): Promise<void> {
    try {
        const database = await openDB();
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const getRequest = store.get(id);

        await new Promise<void>((resolve, reject) => {
            getRequest.onsuccess = () => {
                const response = getRequest.result as PendingResponse;
                if (response) {
                    response.synced = true;
                    const putRequest = store.put(response);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    } catch (error) {
        console.error('Failed to mark response as synced:', error);
    }
}

export async function syncPendingResponses(): Promise<number> {
    const pending = await getPendingResponses();
    let synced = 0;

    for (const response of pending) {
        try {
            const res = await fetch('/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: response.sessionId,
                    questionId: response.questionId,
                    value: response.value
                })
            });

            if (res.ok) {
                await markResponseSynced(response.id);
                synced++;
            }
        } catch {
            // Will retry on next sync
        }
    }

    return synced;
}

// Check online status and sync when coming back online  
export function setupOnlineSync(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
        console.log('Back online, syncing pending responses...');
        const synced = await syncPendingResponses();
        console.log(`Synced ${synced} pending responses`);
    });
}

// Check if offline
export function isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
}
