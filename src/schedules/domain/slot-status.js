/**
 * Possibles slot status.
 * @enum {string}
 * @readonly
 */
export const SlotStatus = Object.freeze({
  FREE: "FREE",
  PROPOSED: "PROPOSED",
  BOOKED: "BOOKED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
  ARRIVED: "ARRIVED",
  IN_PROGRESS: "IN_PROGRESS",
  FULFILLED: "FULFILLED",
  NEEDS_RESCHEDULE: "NEEDS_RESCHEDULE",
});

/**
 * @typedef {keyof typeof SlotStatus} SlotStatusKey
 */
