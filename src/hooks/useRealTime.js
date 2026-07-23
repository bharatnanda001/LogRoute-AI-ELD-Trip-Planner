// src/hooks/useRealTime.js
// ═══════════════════════════════════════════════════════════════════
// React Hook for Live Real-Time System & Internet Clock
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { getTimeInfo, syncNetworkTime } from '../services/timeService';

export default function useRealTime() {
  const [timeInfo, setTimeInfo] = useState(getTimeInfo());

  useEffect(() => {
    // Refresh time info every second
    const interval = setInterval(() => {
      setTimeInfo(getTimeInfo());
    }, 1000);

    // Periodically re-sync with Network Time API every 5 minutes
    const syncInterval = setInterval(() => {
      syncNetworkTime().then(() => setTimeInfo(getTimeInfo()));
    }, 300000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);

  return timeInfo;
}
