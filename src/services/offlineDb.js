// src/services/offlineDb.js
// ═══════════════════════════════════════════════════════════════════
// IndexedDB Native Service — zero dependency client-side persistence
// Stores: timelineBlocks, gpsPositions, eldEvents, dvirReports, syncQueue
// ═══════════════════════════════════════════════════════════════════

const DB_NAME = 'LogRouteAI_OfflineDB';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Stores
        if (!db.objectStoreNames.contains('timeline_blocks')) {
          const store = db.createObjectStore('timeline_blocks', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('gps_positions')) {
          const store = db.createObjectStore('gps_positions', { keyPath: 'id', autoIncrement: true });
          store.createIndex('recordedAt', 'recordedAt');
          store.createIndex('synced', 'synced');
        }

        if (!db.objectStoreNames.contains('eld_events')) {
          const store = db.createObjectStore('eld_events', { keyPath: 'id' });
          store.createIndex('recordedAt', 'recordedAt');
        }

        if (!db.objectStoreNames.contains('dvir_reports')) {
          db.createObjectStore('dvir_reports', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'queueId', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }
  return dbPromise;
}

export async function saveOfflineItem(storeName, item) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put({
      ...item,
      version: item.version || Date.now(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineItems(storeName) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineItem(storeName, key) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineStore(storeName) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
