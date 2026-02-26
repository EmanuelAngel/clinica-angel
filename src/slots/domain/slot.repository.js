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
 * Data required to create an overbook slot.
 * @typedef {object} CreateOverbookData
 * @property {number} scheduleId - Schedule ID inherited from source slot.
 * @property {Date} startsAt - Start time inherited from source slot.
 * @property {number} patientId - Patient ID for the overbook.
 * @property {string} consultationReason - Consultation reason.
 */

/**
 * Schedule overbook quota limits.
 * @typedef {object} ScheduleOverbookLimits
 * @property {number} maxOverbooksPerSlot - Max overbooks per time slot.
 * @property {number} maxOverbooksPerDay - Max overbooks per day.
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
 * @property {(scheduleId: number, startsAt: Date) => Promise<number>} countActiveOverbooksByTime
 * Counts active (non-CANCELLED) overbooks for a specific schedule and time.
 * @property {(scheduleId: number, dayStart: Date, dayEnd: Date) => Promise<number>} countActiveOverbooksByDay
 * Counts active (non-CANCELLED) overbooks for a specific schedule within a day range.
 * @property {(data: CreateOverbookData) => Promise<number>} createOverbook
 * Creates a new overbook slot and returns its ID.
 * @property {(scheduleId: number) => Promise<ScheduleOverbookLimits | null>} findScheduleLimits
 * Finds the overbook limits for a schedule.
 */
