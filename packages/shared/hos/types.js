// packages/shared/hos/types.js
/**
 * @typedef {'off_duty'|'sleeper_berth'|'driving'|'on_duty_not_driving'} DutyStatus
 */

/**
 * @typedef {Object} TimelineBlock
 * @property {string} id
 * @property {DutyStatus} dutyStatus
 * @property {number} startMin
 * @property {number} endMin
 * @property {string} [annotation]
 * @property {Object} [location]
 */
export default {};
