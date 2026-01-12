/**
 * @typedef {import("../../../generated/prisma/index.js").Schedule} PrismaSchedule
 * @typedef {import("../../../generated/prisma/index.js").ScheduleConfig} PrismaScheduleConfig
 * @typedef {import("../../../generated/prisma/index.js").ScheduleBlock} PrismaScheduleBlock
 * @typedef {import("../../../generated/prisma/index.js").Slot} PrismaSlot
 * @typedef {import("../../../generated/prisma/index.js").DayOfWeek} DayOfWeek
 */

/**
 * @typedef {object} CreateScheduleData
 * @property {string} professionalLicense - License number of the professional
 * @property {number} locationId - Location ID
 * @property {number} classificationId - Classification ID
 * @property {number} slotDuration - Slot duration in minutes
 * @property {number} maxOverbooksPerDay - Max overbooks per day
 * @property {number} maxOverbooksPerSlot - Max overbooks per slot
 */

/**
 * @typedef {object} CreateConfigData
 * @property {DayOfWeek} dayOfWeek
 * @property {Date} startTime
 * @property {Date} endTime
 * @property {Date} validFrom
 * @property {Date} validUntil
 */

/**
 * @typedef {object} CreateBlockData
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {string} reason
 */

/**
 * @typedef {object} CreateSlotData
 * @property {Date} startsAt
 */

/**
 * @typedef {object} ScheduleWithRelations
 * @property {number} id
 * @property {string} professionalLicense
 * @property {number} locationId
 * @property {number} classificationId
 * @property {number} slotDuration
 * @property {number} maxOverbooksPerDay
 * @property {number} maxOverbooksPerSlot
 * @property {boolean} isPaused
 * @property {Date | null} deletedAt
 * @property {{ name: string, address: string }} location
 * @property {{ name: string }} classification
 * @property {{ user: { firstNames: string, lastNames: string }, specialty: { name: string } }} professional
 * @property {PrismaScheduleConfig[]} configs
 */

/**
 * @typedef {object} ExistingConfigForOverlap
 * @property {DayOfWeek} dayOfWeek
 * @property {Date} startTime
 * @property {Date} endTime
 * @property {Date} validFrom
 * @property {Date} validUntil
 */

/**
 * @typedef {object} SlotWithPatient
 * @property {number} id
 * @property {Date} startsAt
 * @property {string} status
 * @property {boolean} isOverbook
 * @property {string | null} consultationReason
 * @property {{ firstNames: string, lastNames: string } | null} patient
 */

/**
 * @typedef {ScheduleWithRelations & { slots: SlotWithPatient[], blocks: PrismaScheduleBlock[] }} ScheduleWithSlots
 */

/**
 * @typedef {object} ScheduleRepository
 * @property {function(string): Promise<ScheduleWithRelations | null>} findActiveByLicenseNumber
 * Find an active schedule by the professional's license number.
 * Returns null if no active schedule exists.
 * @property {function(string, DayOfWeek, Date, Date): Promise<ExistingConfigForOverlap[]>} findConfigsByLicenseAndDay
 * Find existing schedule configs for a license on a specific day of week
 * within a date range for overlap validation.
 * @property {function(CreateScheduleData, CreateConfigData[], CreateBlockData[], CreateSlotData[]): Promise<ScheduleWithRelations>} create
 * Create a new schedule with configs, blocks, and slots atomically.
 * @property {function(): Promise<ScheduleWithRelations[]>} findAll
 * Find all active schedules.
 * @property {function(number, Date, Date): Promise<ScheduleWithSlots | null>} findByIdWithSlots
 * Find a schedule by ID with slots in the given date range.
 */
