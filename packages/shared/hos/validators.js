// packages/shared/hos/validators.js
// ═══════════════════════════════════════════════════════════════════
// HOS Timeline Block Validators & Overlap Detection
// ═══════════════════════════════════════════════════════════════════

/**
 * Validates that an array of timeline blocks covers 24 hours (1440 minutes)
 * without gaps or overlaps.
 */
export function validateTimelineCoverage(blocks = []) {
  if (!blocks.length) return { isValid: false, error: 'Timeline is empty' };

  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const errors = [];

  if (sorted[0].startMin !== 0) {
    errors.push(`Timeline must start at minute 0 (starts at ${sorted[0].startMin})`);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.endMin > next.startMin) {
      errors.push(`Overlap detected between block ${current.id} and block ${next.id}`);
    } else if (current.endMin < next.startMin) {
      errors.push(`Gap detected between minute ${current.endMin} and minute ${next.startMin}`);
    }
  }

  const last = sorted[sorted.length - 1];
  if (last.endMin !== 1440) {
    errors.push(`Timeline must end at minute 1440 (ends at ${last.endMin})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
