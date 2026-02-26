/**
 * @typedef {import("../domain/schedule.model.js").Schedule} Schedule
 * @typedef {import("../domain/schedule.model.js").ScheduleBlock} ScheduleBlock
 * @typedef {import("../domain/schedule.model.js").Slot} Slot
 * @typedef {import("../infrastructure/schedule-comparison.schemas.js").ComparisonFilters} ComparisonFilters
 * @typedef {object} ScheduleRepository
 * @property {(licenseNumber: string) => Promise<boolean>} checkActive
 * Checks if the professional already has an active schedule with the same
 * specialty.
 * @property {(licenseNumber: string, fromDate: Date, toDate: Date) => Promise<Schedule[]>} findActiveByLicenseAndDateRange
 * Search active schedules that overlap with the given date range.
 * @property {(data: Schedule, slots: Slot[]) => Promise<void>} createWithSlots
 * Creates a new schedule and its slots.
 * @property {() => Promise<any[]>} findAll
 * @property {(id: number) => Promise<boolean>} checkExist
 * @property {(id: number) => Promise<any | null>} findByIdWithDetails
 * @property {(filters: ComparisonFilters) => Promise<any[]>} findForComparison
 * Finds non-deleted schedules matching filters with slots for a specific date.
 * @property {(scheduleId: number, startDate: Date, endDate: Date) => Promise<any | null>} findForDrilldown
 * Finds a single schedule by ID with slots and blocks for a date range.
 * @property {(id: number) => Promise<any | null>} findSlotById
 * Finds a slot by its ID with full details.
 * @property {(id: number, status: string) => Promise<void>} updateSlotStatus
 * Updates a slot's status.
 * @property {(from?: Date, to?: Date) => Promise<ScheduleBlock[]>} findGlobalBlocks
 * Finds all global blocks (those with scheduleId as null), optionally within a date range.
 * @property {(scheduleId: number, blockData: { startDate: Date, endDate: Date, reason: string }) => Promise<{ deletedFree: number, markedReschedule: number }>} registerScheduleBlock
 * Registers a schedule block and handles affected slots transactionally.
 * @property {() => Promise<any[]>} findSlotsNeedingReschedule
 * Finds all slots in NEEDS_RESCHEDULE status with patient and schedule details.
 */
