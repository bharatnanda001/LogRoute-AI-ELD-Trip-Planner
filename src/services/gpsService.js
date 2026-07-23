// src/services/gpsService.js
// ═══════════════════════════════════════════════════════════════════
// GPS Breadcrumb Recorder & Geolocation Service
// Records position every 60s, logs to IndexedDB & syncs to backend API.
// ═══════════════════════════════════════════════════════════════════

import { saveOfflineItem } from './offlineDb.js';
import { authFetch } from './authService.js';

let watchId = null;
let lastRecordedTime = 0;
const RECORD_INTERVAL_MS = 60000; // 60 seconds

export function startGpsTracking(onPositionChange, onError) {
  if (watchId !== null) return;

  if (!navigator.geolocation) {
    if (onError) onError(new Error('Geolocation is not supported by this browser'));
    logDiagnosticEvent('gps_lost', 'Geolocation API unavailable');
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const now = Date.now();
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speedMph: position.coords.speed ? Math.round(position.coords.speed * 2.23694) : 0,
        heading: position.coords.heading || 0,
        accuracyM: position.coords.accuracy || 0,
        recordedAt: new Date(position.timestamp).toISOString(),
        source: 'browser_gps',
      };

      if (onPositionChange) onPositionChange(coords);

      // Record at most once every 60 seconds
      if (now - lastRecordedTime >= RECORD_INTERVAL_MS) {
        lastRecordedTime = now;
        await recordGpsPosition(coords);
      }
    },
    (err) => {
      console.warn('GPS position error:', err.message);
      if (onError) onError(err);
      logDiagnosticEvent('gps_lost', err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    }
  );
}

export function stopGpsTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

async function recordGpsPosition(coords) {
  // Save to IndexedDB offline DB
  await saveOfflineItem('gps_positions', coords);

  // Sync to API if online
  if (navigator.onLine) {
    try {
      await authFetch('/api/gps/batch', {
        method: 'POST',
        body: JSON.stringify({ positions: [coords] }),
      });
    } catch (_) {
      // Retained in IndexedDB for offline flush
    }
  }
}

async function logDiagnosticEvent(diagnosticCode, description) {
  try {
    await authFetch('/api/diagnostics', {
      method: 'POST',
      body: JSON.stringify({
        diagnosticCode,
        severity: 'warning',
        description,
      }),
    });
  } catch (_) {
    // Ignore diagnostic logging failure
  }
}
