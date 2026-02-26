/**
 * @typedef {import("../domain/schedule.repository.js").ScheduleRepository} ScheduleRepository
 * @typedef {import("../../../generated/prisma/client.js").DayOfWeek} DayOfWeek
 * @typedef {import("../../../generated/prisma/client.js").SlotStatus} SlotStatus
 */

/**
 * @typedef {import("../../../generated/prisma/index.js").Prisma.ScheduleGetPayload<{
 *  include: {
 *    configs: true,
 *    blocks: true
 *  },
 * }>} ScheduleWithConfigsAndBlocks
 */

import {
  Schedule,
  ScheduleBlock,
  ScheduleConfig,
  Slot,
} from "../domain/schedule.model.js";

/**
 * @implements {ScheduleRepository}
 */
export class PrismaScheduleRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * @param {string} licenseNumber
   */
  async checkActive(licenseNumber) {
    const professionalSpecialty =
      await this.db.professionalSpecialty.findUnique({
        where: { licenseNumber },
        select: { userId: true, specialtyId: true },
      });

    if (!professionalSpecialty) {
      return false;
    }

    const count = await this.db.schedule.count({
      where: {
        professional: {
          userId: professionalSpecialty.userId,
          specialtyId: professionalSpecialty.specialtyId,
        },
        deletedAt: null,
      },
    });

    return count > 0;
  }

  /**
   * Search active schedules that overlap with the given date range.
   * @param {string} licenseNumber
   * @param {Date} fromDate
   * @param {Date} toDate
   * @returns {Promise<Schedule[]>} Found schedules that overlap with the given date range.
   */
  async findActiveByLicenseAndDateRange(licenseNumber, fromDate, toDate) {
    const professionalSpecialty =
      await this.db.professionalSpecialty.findUnique({
        where: { licenseNumber },
        select: { userId: true },
      });

    if (!professionalSpecialty) {
      return [];
    }

    const schedules = await this.db.schedule.findMany({
      where: {
        professional: {
          userId: professionalSpecialty.userId,
        },
        deletedAt: null,
        configs: {
          some: {
            validFrom: {
              lt: toDate,
            },
            validUntil: {
              gt: fromDate,
            },
          },
        },
      },
      include: {
        configs: true,
        blocks: true,
      },
    });

    return schedules.map((schedule) => this.mapToDomain(schedule));
  }

  /**
   * Insert a new schedule, it's config, blocks and slots.
   * @param {Schedule} schedule
   * @param {Slot[]} slots
   * @returns {Promise<void>}
   */
  async createWithSlots(schedule, slots) {
    await this.db.$transaction(async (tx) => {
      const newSchedule = await tx.schedule.create({
        data: {
          professionalLicense: schedule.professionalLicense,
          locationId: schedule.locationId,
          classificationId: schedule.classificationId,
          slotDuration: schedule.slotDurationMinutes,
          maxOverbooksPerDay: schedule.maxOverbooksPerDay,
          maxOverbooksPerSlot: schedule.maxOverbooksPerSlot,
          isPaused: schedule.isPaused,

          configs: {
            create: schedule.configs.map((config) => ({
              dayOfWeek: /** @type {DayOfWeek} */ (config.dayOfWeek),
              startTime: config.startTime,
              endTime: config.endTime,
              validFrom: config.validFrom,
              validUntil: config.validUntil,
            })),
          },

          blocks: {
            create: schedule.blocks.map((block) => ({
              startDate: block.startDate,
              endDate: block.endDate,
              reason: block.reason,
            })),
          },
        },
      });

      const slotsData = slots.map((slot) => ({
        scheduleId: newSchedule.id,
        startsAt: slot.startsAt,
        status: /** @type {SlotStatus} */ (slot.status),
        isOverbook: false,
      }));

      await tx.slot.createMany({
        data: slotsData,
      });
    });
  }

  async findAll() {
    return await this.db.schedule.findMany({
      include: {
        configs: true,
        blocks: true,
        professional: {
          include: {
            user: true,
            specialty: true,
          },
        },
        location: true,
        classification: true,
      },
    });
  }

  /**
   * @param {number} id
   */
  async findByIdWithDetails(id) {
    return await this.db.schedule.findUnique({
      where: { id },
      include: {
        configs: true,
        blocks: true,
        professional: {
          include: {
            user: true,
            specialty: true,
          },
        },
        location: true,
        classification: true,
        slots: true,
      },
    });
  }

  /**
   * @param {number} id
   */
  async checkExist(id) {
    const count = await this.db.schedule.count({
      where: {
        id,
      },
    });

    return count > 0;
  }

  /**
   * Maps a Prisma object to a Domain Model.
   * @param {ScheduleWithConfigsAndBlocks} prismaSchedule
   * @returns {Schedule} Domain Schedules.
   */
  mapToDomain(prismaSchedule) {
    return new Schedule({
      id: prismaSchedule.id,
      professionalLicense: prismaSchedule.professionalLicense,
      locationId: prismaSchedule.locationId,
      classificationId: prismaSchedule.classificationId,
      slotDurationMinutes: prismaSchedule.slotDuration,
      maxOverbooksPerDay: prismaSchedule.maxOverbooksPerDay,
      maxOverbooksPerSlot: prismaSchedule.maxOverbooksPerSlot,
      isPaused: prismaSchedule.isPaused,
      deletedAt: prismaSchedule.deletedAt,
      configs: (prismaSchedule.configs || []).map(
        (c) =>
          new ScheduleConfig({
            dayOfWeek: c.dayOfWeek,
            startTime: c.startTime,
            endTime: c.endTime,
            validFrom: c.validFrom,
            validUntil: c.validUntil,
          })
      ),

      blocks: (prismaSchedule.blocks || []).map(
        (b) =>
          new ScheduleBlock({
            startDate: b.startDate,
            endDate: b.endDate,
            reason: b.reason,
          })
      ),
    });
  }

  /**
   * Finds non-deleted schedules matching filters with slots for a specific date.
   * @param {import("./schedule-comparison.schemas.js").ComparisonFilters} filters
   * @returns {Promise<any[]>} Schedules with slots for the specified day.
   */
  async findForComparison(filters) {
    const {
      date,
      location_id,
      specialty_id,
      professional_id,
      classification_id,
    } = filters;

    // Calculate day boundaries for slot filtering
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Build dynamic where clause
    /** @type {import("../../../generated/prisma/index.js").Prisma.ScheduleWhereInput} */
    const whereClause = {
      deletedAt: null,
    };

    if (location_id) {
      whereClause.locationId = location_id;
    }

    if (classification_id) {
      whereClause.classificationId = classification_id;
    }

    if (specialty_id || professional_id) {
      whereClause.professional = {};
      if (specialty_id) {
        whereClause.professional.specialtyId = specialty_id;
      }
      if (professional_id) {
        whereClause.professional.userId = professional_id;
      }
    }

    return await this.db.schedule.findMany({
      where: whereClause,
      include: {
        professional: {
          include: {
            user: {
              select: {
                firstNames: true,
                lastNames: true,
              },
            },
            specialty: {
              select: {
                name: true,
              },
            },
          },
        },
        location: {
          select: {
            name: true,
          },
        },
        classification: {
          select: {
            name: true,
          },
        },
        blocks: {
          where: {
            // Block overlaps with the requested day
            startDate: { lte: dayEnd },
            endDate: { gte: dayStart },
          },
        },
        slots: {
          where: {
            startsAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          include: {
            patient: {
              select: {
                firstNames: true,
                lastNames: true,
              },
            },
          },
          orderBy: {
            startsAt: "asc",
          },
        },
      },
      orderBy: [
        { location: { name: "asc" } },
        { professional: { user: { lastNames: "asc" } } },
      ],
    });
  }

  /**
   * Finds a single schedule by ID with slots and blocks for a date range (drilldown view).
   * @param {number} scheduleId - Schedule ID.
   * @param {Date} startDate - Start of range (inclusive).
   * @param {Date} endDate - End of range (inclusive).
   * @returns {Promise<any | null>} Schedule with slots and blocks, or null.
   */
  async findForDrilldown(scheduleId, startDate, endDate) {
    return await this.db.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        professional: {
          include: {
            user: {
              select: {
                firstNames: true,
                lastNames: true,
              },
            },
            specialty: {
              select: {
                name: true,
              },
            },
          },
        },
        location: {
          select: {
            name: true,
          },
        },
        classification: {
          select: {
            name: true,
          },
        },
        configs: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        blocks: {
          orderBy: {
            startDate: "asc",
          },
        },
        slots: {
          where: {
            startsAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            patient: {
              select: {
                firstNames: true,
                lastNames: true,
              },
            },
          },
          orderBy: {
            startsAt: "asc",
          },
        },
      },
    });
  }

  /**
   * Finds a slot by its ID with full details for the modal.
   * @param {number} id - Slot ID.
   * @returns {Promise<any | null>} Slot with patient and schedule details.
   */
  async findSlotById(id) {
    return await this.db.slot.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            patientInsurances: {
              include: {
                insurance: true,
              },
            },
          },
        },
        schedule: {
          include: {
            professional: {
              include: {
                user: true,
                specialty: true,
              },
            },
            location: true,
            classification: true,
          },
        },
      },
    });
  }

  /**
   * Updates a slot's status.
   * @param {number} id - Slot ID.
   * @param {string} status - New status.
   * @returns {Promise<void>}
   */
  async updateSlotStatus(id, status) {
    // Method signature only for now as requested by user.
    // In the future: await this.db.slot.update({ where: { id }, data: { status } });
  }

  /**
   * Finds all global blocks (those with scheduleId as null), optionally within a date range.
   * @param {Date} [from]
   * @param {Date} [to]
   * @returns {Promise<ScheduleBlock[]>}
   */
  async findGlobalBlocks(from, to) {
    /** @type {import("../../../generated/prisma/index.js").Prisma.ScheduleBlockWhereInput} */
    const where = {
      scheduleId: null,
    };

    if (from && to) {
      where.startDate = { lte: to };
      where.endDate = { gte: from };
    }

    const blocks = await this.db.scheduleBlock.findMany({
      where,
    });

    return blocks.map(
      (b) =>
        new ScheduleBlock({
          startDate: b.startDate,
          endDate: b.endDate,
          reason: b.reason,
        })
    );
  }

  /**
   * Registers a schedule block within a transaction:
   * 1. Creates the block record.
   * 2. Deletes all FREE slots in the date range.
   * 3. Updates PROPOSED/BOOKED slots to NEEDS_RESCHEDULE.
   * @param {number} scheduleId
   * @param {{ startDate: Date, endDate: Date, reason: string }} blockData
   * @returns {Promise<{ deletedFree: number, markedReschedule: number }>}
   */
  async registerScheduleBlock(scheduleId, blockData) {
    const rangeStart = new Date(blockData.startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(blockData.endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    return await this.db.$transaction(async (tx) => {
      // 1. Insert the block
      await tx.scheduleBlock.create({
        data: {
          scheduleId,
          startDate: blockData.startDate,
          endDate: blockData.endDate,
          reason: blockData.reason,
        },
      });

      // 2. Delete FREE slots in the range
      const deletedFree = await tx.slot.deleteMany({
        where: {
          scheduleId,
          startsAt: { gte: rangeStart, lte: rangeEnd },
          status: "FREE",
        },
      });

      // 3. Update PROPOSED/BOOKED (including overbooks) to NEEDS_RESCHEDULE
      const markedReschedule = await tx.slot.updateMany({
        where: {
          scheduleId,
          startsAt: { gte: rangeStart, lte: rangeEnd },
          status: { in: ["PROPOSED", "BOOKED"] },
        },
        data: {
          status: "NEEDS_RESCHEDULE",
        },
      });

      return {
        deletedFree: deletedFree.count,
        markedReschedule: markedReschedule.count,
      };
    });
  }

  /**
   * Finds all slots in NEEDS_RESCHEDULE status with patient and schedule details.
   * @returns {Promise<any[]>}
   */
  async findSlotsNeedingReschedule() {
    return await this.db.slot.findMany({
      where: {
        status: "NEEDS_RESCHEDULE",
      },
      include: {
        patient: {
          select: {
            firstNames: true,
            lastNames: true,
            phone: true,
            email: true,
          },
        },
        schedule: {
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    firstNames: true,
                    lastNames: true,
                  },
                },
                specialty: {
                  select: { name: true },
                },
              },
            },
            location: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  }

  /**
   * Updates a schedule's configuration fields (overbooking and pause status).
   * @param {number} id - Schedule ID.
   * @param {object} data - Data to update.
   * @returns {Promise<void>}
   */
  async updateConfig(id, data) {
    await this.db.schedule.update({
      where: { id },
      data: {
        maxOverbooksPerDay: data.maxOverbooksPerDay,
        maxOverbooksPerSlot: data.maxOverbooksPerSlot,
        isPaused: data.isPaused,
      },
    });
  }
}
