// src/stores/useUiStore.js
// ═══════════════════════════════════════════════════════════════════
// UI Navigation, Modals, & Roadside Inspection View Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

export const useUiStore = create((set) => ({
  activeTab: 'dashboard', // 'dashboard' | 'planner' | 'logs' | 'recap' | 'dvir' | 'history' | 'inspection'
  isAiCopilotOpen: false,
  isInspectionMode: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsAiCopilotOpen: (open) => set({ isAiCopilotOpen: open }),
  setIsInspectionMode: (mode) => set({ isInspectionMode: mode }),
}));
