/**
 * @typedef {import("../../schedules/domain/slot-status.js").SlotStatusKey} SlotStatusKey
 */

/**
 * Slot with details for state machine operations.
 * @typedef {object} SlotWithDetails
 * @property {number} id - Slot ID.
 * @property {SlotStatusKey} status - Current status.
 * @property {Date} startsAt - Slot start time.
 * @property {number} scheduleId - Schedule ID.
 * @property {number | null} patientId - Patient ID (null if FREE).
 * @property {string | null} consultationReason - Reason for consultation.
 * @property {boolean} isOverbook - Whether this is an overbook slot.
 */

/**
 * @typedef {object} SlotRepository
 * @property {(id: number) => Promise<SlotWithDetails | null>} findById
 * Finds a slot by ID with basic details.
 * @property {(id: number, status: SlotStatusKey) => Promise<void>} updateStatus
 * Updates only the status field.
 * @property {(id: number, patientId: number, consultationReason: string) => Promise<void>} reserve
 * Reserves a slot: sets patientId, consultationReason, and status to PROPOSED.
 * @property {(id: number) => Promise<void>} release
 * Releases a slot: clears patientId, consultationReason, and sets status to FREE.
 */
