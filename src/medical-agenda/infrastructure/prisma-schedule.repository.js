/**
 * @typedef {import("../domain/schedule.repository.js").ScheduleRepository} ScheduleRepository
 * @typedef {import("../domain/schedule.repository.js").CreateScheduleData} CreateScheduleData
 * @typedef {import("../domain/schedule.repository.js").CreateConfigData} CreateConfigData
 * @typedef {import("../domain/schedule.repository.js").CreateBlockData} CreateBlockData
 * @typedef {import("../domain/schedule.repository.js").CreateSlotData} CreateSlotData
 * @typedef {import("../domain/schedule.repository.js").ScheduleWithRelations} ScheduleWithRelations
 * @typedef {import("../domain/schedule.repository.js").ExistingConfigForOverlap} ExistingConfigForOverlap
 * @typedef {import("../../../generated/prisma/index.js").DayOfWeek} DayOfWeek
 */

/**
 * @implements {ScheduleRepository}
 */
export class PrismaScheduleRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Find an active schedule by the professional's license number.
   * @param {string} licenseNumber
   * @returns {Promise<ScheduleWithRelations | null>}
   */
  async findActiveByLicenseNumber(licenseNumber) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        professionalLicense: licenseNumber,
        deletedAt: null,
      },
      include: {
        location: {
          select: { name: true, address: true },
        },
        classification: {
          select: { name: true },
        },
        professional: {
          include: {
            user: {
              select: { firstNames: true, lastNames: true },
            },
            specialty: {
              select: { name: true },
            },
          },
        },
        configs: true,
      },
    });

    return schedule ? this.mapToScheduleWithRelations(schedule) : null;
  }

  /**
   * Find existing schedule configs for overlap validation.
   * @param {string} licenseNumber
   * @param {DayOfWeek} dayOfWeek
   * @param {Date} validFrom
   * @param {Date} validUntil
   * @returns {Promise<ExistingConfigForOverlap[]>}
   */
  async findConfigsByLicenseAndDay(
    licenseNumber,
    dayOfWeek,
    validFrom,
    validUntil
  ) {
    const configs = await this.prisma.scheduleConfig.findMany({
      where: {
        schedule: {
          professionalLicense: licenseNumber,
          deletedAt: null,
        },
        dayOfWeek,
        // Check for date range overlap:
        // existing.validFrom <= newValidUntil AND existing.validUntil >= newValidFrom
        validFrom: { lte: validUntil },
        validUntil: { gte: validFrom },
      },
    });

    return configs.map((config) => ({
      dayOfWeek: config.dayOfWeek,
      startTime: config.startTime,
      endTime: config.endTime,
      validFrom: config.validFrom,
      validUntil: config.validUntil,
    }));
  }

  /**
   * Find all active schedules.
   * @returns {Promise<ScheduleWithRelations[]>}
   */
  async findAll() {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        location: {
          select: { name: true, address: true },
        },
        classification: {
          select: { name: true },
        },
        professional: {
          include: {
            user: {
              select: { firstNames: true, lastNames: true },
            },
            specialty: {
              select: { name: true },
            },
          },
        },
        configs: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return schedules.map((s) => this.mapToScheduleWithRelations(s));
  }

  /**
   * Create a new schedule with configs, blocks, and slots atomically.
   * @param {CreateScheduleData} scheduleData
   * @param {CreateConfigData[]} configs
   * @param {CreateBlockData[]} blocks
   * @param {CreateSlotData[]} slots
   * @returns {Promise<ScheduleWithRelations>}
   */
  async create(scheduleData, configs, blocks, slots) {
    const created = await this.prisma.$transaction(async (tx) => {
      // Create the schedule
      const schedule = await tx.schedule.create({
        data: {
          professionalLicense: scheduleData.professionalLicense,
          locationId: scheduleData.locationId,
          classificationId: scheduleData.classificationId,
          slotDuration: scheduleData.slotDuration,
          maxOverbooksPerDay: scheduleData.maxOverbooksPerDay,
          maxOverbooksPerSlot: scheduleData.maxOverbooksPerSlot,
        },
      });

      // Create schedule configs
      if (configs.length > 0) {
        await tx.scheduleConfig.createMany({
          data: configs.map((cfg) => ({
            scheduleId: schedule.id,
            dayOfWeek: cfg.dayOfWeek,
            startTime: cfg.startTime,
            endTime: cfg.endTime,
            validFrom: cfg.validFrom,
            validUntil: cfg.validUntil,
          })),
        });
      }

      // Create schedule blocks (AC8: blocks are inserted first, then used by slot generator - already handled in use case)
      if (blocks.length > 0) {
        await tx.scheduleBlock.createMany({
          data: blocks.map((block) => ({
            scheduleId: schedule.id,
            startDate: block.startDate,
            endDate: block.endDate,
            reason: block.reason,
          })),
        });
      }

      // Create slots
      if (slots.length > 0) {
        await tx.slot.createMany({
          data: slots.map((slot) => ({
            scheduleId: schedule.id,
            startsAt: slot.startsAt,
            status: "FREE",
            isOverbook: false,
          })),
        });
      }

      // Fetch the complete schedule with relations
      return tx.schedule.findUnique({
        where: { id: schedule.id },
        include: {
          location: {
            select: { name: true, address: true },
          },
          classification: {
            select: { name: true },
          },
          professional: {
            include: {
              user: {
                select: { firstNames: true, lastNames: true },
              },
              specialty: {
                select: { name: true },
              },
            },
          },
          configs: true,
        },
      });
    });

    return this.mapToScheduleWithRelations(created);
  }

  /**
   * Find a schedule by ID with slots in the given date range.
   * @param {number} id
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<import("../domain/schedule.repository.js").ScheduleWithSlots | null>}
   */
  async findByIdWithSlots(id, startDate, endDate) {
    const schedule = await this.prisma.schedule.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        location: {
          select: { name: true, address: true },
        },
        classification: {
          select: { name: true },
        },
        professional: {
          include: {
            user: {
              select: { firstNames: true, lastNames: true },
            },
            specialty: {
              select: { name: true },
            },
          },
        },
        configs: true,
        blocks: true,
        slots: {
          where: {
            startsAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          include: {
            patient: {
              select: { firstNames: true, lastNames: true },
            },
          },
          orderBy: {
            startsAt: "asc",
          },
        },
      },
    });

    if (!schedule) {
      return null;
    }

    return {
      ...this.mapToScheduleWithRelations(schedule),
      slots: schedule.slots.map((slot) => ({
        id: slot.id,
        startsAt: slot.startsAt,
        status: slot.status,
        isOverbook: slot.isOverbook,
        consultationReason: slot.consultationReason,
        patient: slot.patient,
      })),
      blocks: schedule.blocks,
    };
  }

  /**
   * Maps a Prisma schedule to ScheduleWithRelations.
   * @param {*} prismaSchedule
   * @returns {ScheduleWithRelations}
   */
  mapToScheduleWithRelations(prismaSchedule) {
    return {
      id: prismaSchedule.id,
      professionalLicense: prismaSchedule.professionalLicense,
      locationId: prismaSchedule.locationId,
      classificationId: prismaSchedule.classificationId,
      slotDuration: prismaSchedule.slotDuration,
      maxOverbooksPerDay: prismaSchedule.maxOverbooksPerDay,
      maxOverbooksPerSlot: prismaSchedule.maxOverbooksPerSlot,
      isPaused: prismaSchedule.isPaused,
      deletedAt: prismaSchedule.deletedAt,
      location: prismaSchedule.location,
      classification: prismaSchedule.classification,
      professional: prismaSchedule.professional,
      configs: prismaSchedule.configs,
    };
  }
}
