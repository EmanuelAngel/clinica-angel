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
    const schedules = await this.db.schedule.findMany({
      where: {
        professionalLicense: licenseNumber,
        deletedAt: null,
        // FIX: validFrom and validUntil logic
        validFrom: {
          lt: toDate,
        },
        validUntil: {
          gt: fromDate,
        },
      },
      include: {
        configs: true,
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
}
