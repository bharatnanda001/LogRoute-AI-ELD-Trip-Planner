// src/stores/useAuthStore.js
// ═══════════════════════════════════════════════════════════════════
// User Identity, Auth Token, & Multi-Tenant Carrier Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

const MOCK_COMPANIES = [
  { id: 'c1', name: 'ABC Logistics LLC', driversCount: 120, dot: 'DOT-889102', tier: 'Enterprise' },
  { id: 'c2', name: 'XYZ Transport Corp', driversCount: 58, dot: 'DOT-441209', tier: 'Pro' },
  { id: 'c3', name: 'Delta Freight Systems', driversCount: 320, dot: 'DOT-771204', tier: 'Enterprise' },
];

export const useAuthStore = create((set) => ({
  activeRole: 'driver', // 'driver' | 'fleet' | 'admin'
  activeCompany: MOCK_COMPANIES[0],
  companies: MOCK_COMPANIES,
  user: {
    id: 'usr_101',
    name: 'John Smith',
    license: 'DL-9948201',
    state: 'TX',
    carrier: 'ABC Logistics LLC',
  },

  setActiveRole: (role) => set({ activeRole: role }),
  setActiveCompany: (company) => set({ activeCompany: company }),
}));
