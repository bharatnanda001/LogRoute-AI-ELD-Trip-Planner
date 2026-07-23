// src/services/timeService.js
// ═══════════════════════════════════════════════════════════════════
// FMCSA §395.26 Compliant Real-Time Date & Clock Service
// Syncs system clock with Internet Network Time (WorldTime API / timeapi.io)
// Falls back gracefully to system Date with status tracking.
// ═══════════════════════════════════════════════════════════════════

let clockOffsetMs = 0; // Difference between network time and system clock
let timeSource = 'System Clock'; // 'Network API' | 'System Clock'
let lastSyncedAt = null;

/**
 * Attempt to sync clock with Internet Network Time API
 */
export async function syncNetworkTime() {
  const providers = [
    async () => {
      const res = await fetch('https://worldtimeapi.org/api/ip', { cache: 'no-store' });
      if (!res.ok) throw new Error('WorldTimeAPI failed');
      const data = await res.json();
      return new Date(data.datetime).getTime();
    },
    async () => {
      const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC', { cache: 'no-store' });
      if (!res.ok) throw new Error('TimeAPI failed');
      const data = await res.json();
      return new Date(data.dateTime).getTime();
    },
  ];

  for (const provider of providers) {
    try {
      const start = Date.now();
      const networkTimestamp = await provider();
      const end = Date.now();
      const rtt = Math.round((end - start) / 2);

      const trueNetworkTime = networkTimestamp + rtt;
      clockOffsetMs = trueNetworkTime - Date.now();
      timeSource = 'Network (NTP/WorldTime API)';
      lastSyncedAt = new Date(trueNetworkTime);
      return { success: true, timeSource, offsetMs: clockOffsetMs };
    } catch (_) {
      // Try next provider
    }
  }

  timeSource = 'System Clock (Local Device)';
  return { success: false, timeSource, offsetMs: 0 };
}

/**
 * Get current date adjusted by network offset if available
 */
export function getSyncedDate() {
  return new Date(Date.now() + clockOffsetMs);
}

/**
 * Get time source metadata
 */
export function getTimeInfo() {
  const date = getSyncedDate();
  return {
    date,
    timeSource,
    lastSyncedAt,
    offsetMs: clockOffsetMs,
    isoDate: date.toISOString().split('T')[0],
    timeString: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    longDateString: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    timeZoneStr: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Format Date object to YYYY-MM-DD
 */
export function formatDateISO(d = getSyncedDate()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date object to Month DD, YYYY (e.g. July 23, 2026)
 */
export function formatDateLong(d = getSyncedDate()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Initial auto-sync on load
syncNetworkTime();
