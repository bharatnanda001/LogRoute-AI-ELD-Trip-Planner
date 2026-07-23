// src/stores/useTripStore.js
// ═══════════════════════════════════════════════════════════════════
// Trip Route, Stops, & HOS Output Summary Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { computeDutyTimeline, splitIntoDailyLogSheets } from '../engine/hosEngine.js';

const initialRoute = {
  distanceMiles: 842,
  durationHours: 14.0,
  locations: {
    current: { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
    pickup: { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
    dropoff: { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  },
};

const initialEngineOutput = computeDutyTimeline({
  routeDistanceMiles: 842,
  routeDurationHours: 14.0,
  cycleHoursUsed: 15,
  departureTime: new Date(),
  pickupLocation: { city: 'Dallas', state: 'TX' },
  dropoffLocation: { city: 'Houston', state: 'TX' },
});

const initialDailySheets = splitIntoDailyLogSheets(initialEngineOutput.segments);

export const useTripStore = create((set) => ({
  activeTrip: { origin: 'Dallas, TX', destination: 'Houston, TX' },
  routeData: initialRoute,
  segments: initialEngineOutput.segments,
  dailyLogs: initialDailySheets,
  summary: initialEngineOutput.summary,
  warnings: initialEngineOutput.warnings,

  setTripData: (data) => set({
    activeTrip: data.trip,
    routeData: data.route,
    segments: data.segments,
    dailyLogs: data.dailyLogs,
    summary: data.summary,
    warnings: data.warnings,
  }),
}));
