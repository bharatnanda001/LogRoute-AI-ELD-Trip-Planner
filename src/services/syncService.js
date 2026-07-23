// src/services/syncService.js
// ═══════════════════════════════════════════════════════════════════
// Offline Synchronization & Version-Based Conflict Management Service
// ═══════════════════════════════════════════════════════════════════

import { saveOfflineItem, getOfflineItems, deleteOfflineItem } from './offlineDb.js';
import { authFetch } from './authService.js';

let conflictHandlerCallback = null;

export function registerConflictHandler(cb) {
  conflictHandlerCallback = cb;
}

/**
 * Queue an edit locally in IndexedDB when offline or performing optimistic updates
 */
export async function queueLocalEdit(entityType, entityId, clientData) {
  const item = {
    queueId: `${entityType}_${entityId}_${Date.now()}`,
    entityType,
    entityId,
    clientData,
    clientVersion: Date.now(),
    createdAt: new Date().toISOString(),
  };
  await saveOfflineItem('sync_queue', item);
  return item;
}

/**
 * Flush offline sync queue to server when back online
 */
export async function flushSyncQueue() {
  if (!navigator.onLine) return { flushed: 0, pending: 0 };

  const queue = await getOfflineItems('sync_queue');
  if (queue.length === 0) return { flushed: 0, pending: 0 };

  let flushed = 0;

  for (const item of queue) {
    try {
      const response = await authFetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          entityType: item.entityType,
          entityId: item.entityId,
          clientVersion: item.clientVersion,
          clientData: item.clientData,
        }),
      });

      if (response.status === 409) {
        // Conflict! Invoke UI conflict resolver
        const conflictData = await response.json();
        if (conflictHandlerCallback) {
          conflictHandlerCallback({
            queueItem: item,
            conflictData,
            resolve: async (chosenStrategy, mergedData) => {
              await resolveConflictOnServer(item, chosenStrategy, mergedData);
              await deleteOfflineItem('sync_queue', item.queueId);
            },
          });
        }
      } else if (response.ok) {
        await deleteOfflineItem('sync_queue', item.queueId);
        flushed++;
      }
    } catch (err) {
      console.warn('Sync item push failed:', err);
    }
  }

  return { flushed, pending: queue.length - flushed };
}

async function resolveConflictOnServer(item, resolutionStrategy, mergedData) {
  await authFetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({
      entityType: item.entityType,
      entityId: item.entityId,
      clientVersion: item.clientVersion,
      clientData: mergedData || item.clientData,
      resolutionStrategy,
    }),
  });
}
