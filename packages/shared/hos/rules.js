// packages/shared/hos/rules.js
// ═══════════════════════════════════════════════════════════════════
// FMCSA Regulatory Rules & Violation Metadata
// ═══════════════════════════════════════════════════════════════════

export const HOS_RULES = {
  DRIVING_LIMIT: {
    code: '§395.3(a)(1)',
    title: '11-Hour Driving Limit',
    description: 'May not drive more than 11 hours following 10 consecutive hours off-duty.',
    severity: 'critical',
  },
  SHIFT_WINDOW: {
    code: '§395.3(a)(2)',
    title: '14-Hour Shift Window',
    description: 'May not drive beyond the 14th consecutive hour after coming on duty.',
    severity: 'critical',
  },
  REST_BREAK: {
    code: '§395.3(a)(3)(ii)',
    title: '30-Minute Rest Break',
    description: 'May not drive if more than 8 hours have elapsed since the end of driver\'s last off-duty break of at least 30 minutes.',
    severity: 'major',
  },
  CYCLE_LIMIT: {
    code: '§395.3(b)',
    title: '70-Hour / 8-Day Cycle Limit',
    description: 'May not drive after accumulating 70 hours on duty in any period of 8 consecutive days.',
    severity: 'critical',
  },
  RESTART_34H: {
    code: '§395.3(c)',
    title: '34-Hour Restart',
    description: 'Any 34 consecutive hours off-duty resets cumulative cycle hours to zero.',
    severity: 'info',
  },
};
