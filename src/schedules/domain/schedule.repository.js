/**
 * @typedef {import("../domain/schedule.model.js").Schedule} Schedule
 * @typedef {import("../domain/schedule.model.js").Slot} Slot
 * @typedef {object} ScheduleRepository
 * @property {(licenseNumber: string) => Promise<boolean>} checkActive
 * Checks if the professional already has an active schedule with the same
 * specialty.
 * @property {(licenseNumber: string, fromDate: Date, toDate: Date) => Promise<Schedule[]>} findActiveByLicenseAndDateRange
 * Search active schedules that overlap with the given date range.
 * @property {(data: Schedule, slots: Slot[]) => Promise<void>} createWithSlots
 * Creates a new schedule and its slots.
 */
