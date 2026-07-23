// src/hooks/useGps.js
// ═══════════════════════════════════════════════════════════════════
// React hook wrapping GPS tracking service
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { startGpsTracking, stopGpsTracking } from '../services/gpsService';

export default function useGps(isDriving = false) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (isDriving) {
      setIsTracking(true);
      startGpsTracking(
        (coords) => {
          setPosition(coords);
          setError(null);
        },
        (err) => {
          setError(err.message);
        }
      );
    } else {
      setIsTracking(false);
      stopGpsTracking();
    }

    return () => {
      stopGpsTracking();
    };
  }, [isDriving]);

  return { position, error, isTracking };
}
