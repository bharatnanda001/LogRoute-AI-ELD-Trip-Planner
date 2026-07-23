// src/stores/useGpsStore.js
// ═══════════════════════════════════════════════════════════════════
// GPS Telematics & Automatic Driving Detection Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

export const useGpsStore = create((set) => ({
  simulatedSpeed: 0,
  idleTimeSeconds: 0,
  showAutoDrivePrompt: false,
  currentLocation: { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },

  setSimulatedSpeed: (speed) => set({ simulatedSpeed: Math.max(0, speed) }),
  setIdleTimeSeconds: (sec) => set(typeof sec === 'function' ? (state) => ({ idleTimeSeconds: sec(state.idleTimeSeconds) }) : { idleTimeSeconds: sec }),
  setShowAutoDrivePrompt: (show) => set({ showAutoDrivePrompt: show }),
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
}));
