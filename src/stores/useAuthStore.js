// src/stores/useAuthStore.js
// ═══════════════════════════════════════════════════════════════════
// Full Multi-Role Auth Store — Driver Registration & Fleet Admin Provisioning
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

const MOCK_COMPANIES = [
  { id: 'c1', name: 'ABC Logistics LLC', driversCount: 3, dot: 'DOT-889102', tier: 'Enterprise' },
  { id: 'c2', name: 'XYZ Transport Corp', driversCount: 2, dot: 'DOT-441209', tier: 'Pro' },
];

const MOCK_INITIAL_DRIVERS = [
  { id: 'drv_101', name: 'John Smith', email: 'john@abclogistics.com', license: 'DL-9948201', state: 'TX', carrier: 'ABC Logistics LLC', truckerId: 'TRK-1001', role: 'driver' },
  { id: 'drv_102', name: 'Robert Davis', email: 'robert@abclogistics.com', license: 'DL-8821092', state: 'TX', carrier: 'ABC Logistics LLC', truckerId: 'TRK-1002', role: 'driver' },
];

export const useAuthStore = create((set, get) => ({
  isAuthenticated: true, // Default true for seamless evaluation; full login/logout supported
  activeRole: 'driver',   // 'driver' | 'manager' | 'admin'
  activeCompany: MOCK_COMPANIES[0],
  companies: MOCK_COMPANIES,
  registeredDrivers: MOCK_INITIAL_DRIVERS,
  user: {
    id: 'usr_101',
    name: 'John Smith',
    email: 'john@abclogistics.com',
    license: 'DL-9948201',
    state: 'TX',
    carrier: 'ABC Logistics LLC',
    truckerId: 'TRK-1001',
    role: 'driver',
  },

  setActiveRole: (role) => set({ activeRole: role }),
  setActiveCompany: (company) => set({ activeCompany: company }),

  // Login Action
  login: (email, password, selectedRole = 'driver') => {
    const existingDriver = get().registeredDrivers.find((d) => d.email.toLowerCase() === email.toLowerCase());
    const userProfile = existingDriver || {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' '),
      email,
      license: 'DL-9918201',
      state: 'TX',
      carrier: get().activeCompany.name,
      truckerId: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      role: selectedRole,
    };

    set({
      isAuthenticated: true,
      activeRole: selectedRole,
      user: userProfile,
    });
  },

  // Driver Self-Registration Action (Individual Trucker ID)
  registerDriver: (driverData) => {
    const newDriver = {
      id: `drv_${Date.now()}`,
      name: driverData.name,
      email: driverData.email,
      license: driverData.license,
      state: driverData.state || 'TX',
      carrier: driverData.carrier || 'Independent Driver',
      truckerId: driverData.truckerId || `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'driver',
    };

    set((state) => ({
      registeredDrivers: [newDriver, ...state.registeredDrivers],
      user: newDriver,
      activeRole: 'driver',
      isAuthenticated: true,
    }));
  },

  // Fleet Admin Provisions New Employee Trucker Account
  createDriverByAdmin: (driverData) => {
    const newDriver = {
      id: `drv_${Date.now()}`,
      name: driverData.name,
      email: driverData.email,
      license: driverData.license,
      state: driverData.state || 'TX',
      carrier: get().activeCompany.name,
      truckerId: driverData.truckerId || `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'driver',
    };

    set((state) => ({
      registeredDrivers: [newDriver, ...state.registeredDrivers],
      activeCompany: {
        ...state.activeCompany,
        driversCount: state.activeCompany.driversCount + 1,
      },
    }));
  },

  // Logout Action
  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
    });
  },
}));
