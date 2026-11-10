// IndexedDB offline queue for student MBG claims
const DB_NAME = 'mbg_offline_store';
const DB_VERSION = 1;
const STORE_NAME = 'claims_queue';

export interface OfflineClaimItem {
  id: string;
  type: 'KOLEKTIF_KELAS' | 'MANDIRI';
  classId?: string;
  nisn?: string;
  attendedNisns?: string[];
  pinOrToken: string;
  queuedAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function enqueueOfflineClaim(
  claim: Omit<OfflineClaimItem, 'id' | 'queuedAt' | 'status'>
): Promise<OfflineClaimItem> {
  const item: OfflineClaimItem = {
    ...claim,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    queuedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).put(item);
    });
  } catch (err) {
    // LocalStorage fallback if IndexedDB fails
    if (typeof window !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('mbg_offline_claim_fallback') || '[]');
      local.push(item);
      localStorage.setItem('mbg_offline_claim_fallback', JSON.stringify(local));
    }
  }

  // Request Background Sync via Service Worker if supported
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('mbg-sync-offline-claims');
    } catch {
      // background sync not granted, rely on online event
    }
  }

  return item;
}

export async function getPendingOfflineClaims(): Promise<OfflineClaimItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('mbg_offline_claim_fallback') || '[]');
    }
    return [];
  }
}

export async function clearSyncedOfflineClaim(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).delete(id);
    });
  } catch {
    if (typeof window !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('mbg_offline_claim_fallback') || '[]');
      const filtered = local.filter((i: OfflineClaimItem) => i.id !== id);
      localStorage.setItem('mbg_offline_claim_fallback', JSON.stringify(filtered));
    }
  }
}

