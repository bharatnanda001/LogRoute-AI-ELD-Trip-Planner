// src/stores/useTimelineStore.js
// ═══════════════════════════════════════════════════════════════════
// Single Source of Truth — 24-Hour Duty Status & Enterprise ELD Store
// Personal Conveyance, Yard Moves, HOS Exceptions, & Split Sleeper
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

const initialBlocks = [
  { id: 'b1', dutyStatus: 'off_duty', startMin: 0, endMin: 360, annotation: 'Off Duty Rest', specialCategory: 'none' },
  { id: 'b2', dutyStatus: 'on_duty_not_driving', startMin: 360, endMin: 420, annotation: 'Pre-trip inspection', location: { city: 'Dallas', state: 'TX' }, specialCategory: 'none' },
  { id: 'b3', dutyStatus: 'driving', startMin: 420, endMin: 690, annotation: 'Driving Leg 1', specialCategory: 'none' },
  { id: 'b4', dutyStatus: 'off_duty', startMin: 690, endMin: 720, annotation: '30-min rest break', bracketed: true, specialCategory: 'none' },
  { id: 'b5', dutyStatus: 'driving', startMin: 720, endMin: 1050, annotation: 'Driving Leg 2', specialCategory: 'none' },
  { id: 'b6', dutyStatus: 'on_duty_not_driving', startMin: 1050, endMin: 1110, annotation: 'Drop-off', location: { city: 'Houston', state: 'TX' }, specialCategory: 'yard_move', reason: 'Moving trailer in yard' },
  { id: 'b7', dutyStatus: 'off_duty', startMin: 1110, endMin: 1440, annotation: '10-hr sleeper reset', specialCategory: 'none' },
];

export const useTimelineStore = create((set, get) => ({
  blocks: initialBlocks,
  activeMin: 420,
  isPlaying: false,
  playbackSpeed: 1,

  // Enterprise Rule Set Configuration
  ruleSet: 'interstate_70_8', // 'interstate_70_8' | 'interstate_60_7' | 'intrastate_tx' | 'intrastate_ca'
  activeExceptions: {
    adverseDriving: false,        // §395.1(b)(1) +2h driving/window for emergency weather/road closure
    sixteenHourException: false,  // §395.1(o) 16-hr shift window extension (1x / 7 days)
    shortHaulExemption: false,    // §395.1(e) 150 air-mile radius exemption
  },

  // Special Duty Category Modal States
  specialCategoryReason: '',
  isSpecialCategoryModalOpen: false,
  pendingSpecialCategory: null, // 'personal_conveyance' | 'yard_move'

  // Unidentified Driving Log & Audit Trail
  unidentifiedEvents: [
    { id: 'unid_101', date: '2026-07-23', startTime: '03:15', durationMins: 12, miles: 8.4, status: 'Unassigned Driving' },
  ],
  eventLog: [
    { id: '1', time: '08:00', event: 'Driver Logged In', status: 'off_duty' },
    { id: '2', time: '08:30', event: 'Pre-Trip Inspection Started', status: 'on_duty_not_driving' },
    { id: '3', time: '09:00', event: 'Trip Started & Vehicle Moving', status: 'driving' },
  ],
  auditTrail: [
    { id: 'a1', timestamp: new Date().toISOString(), field: 'Duty Segment', oldValue: 'None', newValue: 'Off Duty Rest', user: 'John Smith', reason: 'Initial seed' },
  ],

  // Actions
  setBlocks: (blocks) => set({ blocks }),
  setActiveMin: (min) => set({ activeMin: Math.max(0, Math.min(1440, min)) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setRuleSet: (ruleSet) => set({ ruleSet }),

  // Toggle HOS Exceptions
  toggleException: (key) => {
    const current = get().activeExceptions;
    set({
      activeExceptions: {
        ...current,
        [key]: !current[key],
      },
    });
  },

  // Update Duty Status with Special Categories (PC / Yard Move)
  updateDutyStatus: (newStatus, customMin = null, autoReason = null, specialCategory = 'none', pcYmReason = '') => {
    const state = get();
    const nowMin = customMin !== null ? customMin : state.activeMin;

    let targetStatus = newStatus;
    // Personal Conveyance is logged as Off Duty
    if (specialCategory === 'personal_conveyance') {
      targetStatus = 'off_duty';
    }
    // Yard Move is logged as On Duty Not Driving
    else if (specialCategory === 'yard_move') {
      targetStatus = 'on_duty_not_driving';
    }

    const currentBlock = state.blocks.find((b) => b.startMin <= nowMin && b.endMin > nowMin) || state.blocks[state.blocks.length - 1];
    const oldStatus = currentBlock ? currentBlock.dutyStatus : 'off_duty';

    const newAudit = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      field: specialCategory !== 'none' ? `Special Status (${specialCategory})` : 'Duty Status',
      oldValue: oldStatus,
      newValue: targetStatus,
      user: 'John Smith',
      reason: pcYmReason || autoReason || 'Driver status change',
    };

    const updatedBlocks = [];
    for (const b of state.blocks) {
      if (b.endMin <= nowMin) {
        updatedBlocks.push(b);
      } else if (b.startMin < nowMin && b.endMin > nowMin) {
        updatedBlocks.push({ ...b, endMin: nowMin });
      }
    }

    let annotationStr = autoReason || `Status changed to ${targetStatus.replace(/_/g, ' ')}`;
    if (specialCategory === 'personal_conveyance') {
      annotationStr = `Personal Conveyance (PC): ${pcYmReason || 'Personal errand'}`;
    } else if (specialCategory === 'yard_move') {
      annotationStr = `Yard Move (YM): ${pcYmReason || 'Yard maneuvering'}`;
    }

    updatedBlocks.push({
      id: `block_${Date.now()}`,
      dutyStatus: targetStatus,
      startMin: Math.min(nowMin, 1425),
      endMin: 1440,
      annotation: annotationStr,
      specialCategory,
      reason: pcYmReason,
    });

    const sortedBlocks = updatedBlocks.sort((a, b) => a.startMin - b.startMin);

    const timeStr = `${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}`;
    const newEvent = {
      id: `evt_${Date.now()}`,
      time: timeStr,
      event: annotationStr,
      status: targetStatus,
    };

    set({
      blocks: sortedBlocks,
      auditTrail: [newAudit, ...state.auditTrail],
      eventLog: [newEvent, ...state.eventLog],
    });
  },

  // Assign Unidentified Driving Event
  assignUnidentifiedEvent: (eventId, driverName = 'John Smith') => {
    const state = get();
    set({
      unidentifiedEvents: state.unidentifiedEvents.filter((e) => e.id !== eventId),
      auditTrail: [
        {
          id: `audit_unid_${Date.now()}`,
          timestamp: new Date().toISOString(),
          field: 'Unidentified Driving Event',
          oldValue: 'Unassigned',
          newValue: driverName,
          user: driverName,
          reason: 'Assigned unidentified driving segment to driver log',
        },
        ...state.auditTrail,
      ],
    });
  },
}));
