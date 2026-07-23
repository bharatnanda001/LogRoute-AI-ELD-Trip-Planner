// server/src/engine/hosEngine.js
// ═══════════════════════════════════════════════════════════════════
// HOS Trip Planning Engine — Shared FMCSA Compliance Engine
// Enforces all FMCSA 49 CFR Part 395 hard limits via shared package.
// ═══════════════════════════════════════════════════════════════════

import {
  computeDutyTimeline as computeSharedTimeline,
  DUTY,
  HOS_LIMITS,
} from '../../../packages/shared/hos/index.js';

export { DUTY, HOS_LIMITS };

export function computeDutyTimeline(params) {
  return computeSharedTimeline(params);
}
