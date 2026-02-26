import { SlotStatus } from "../../schedules/domain/slot-status.js";

/**
 * @typedef {import("../domain/slot.repository.js").SlotRepository} SlotRepository
 * @typedef {import("../domain/slot.repository.js").SlotWithDetails} SlotWithDetails
 */

/**
 * @implements {SlotRepository}
 */
export class PrismaSlotRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * @param {number} id
   * @returns {Promise<SlotWithDetails | null>}
   */
  async findById(id) {
    const slot = await this.db.slot.findUnique({
      where: { id },
    });

    if (!slot) return null;

    return {
      id: slot.id,
      status: slot.status,
      startsAt: slot.startsAt,
      scheduleId: slot.scheduleId,
      patientId: slot.patientId,
      consultationReason: slot.consultationReason,
      isOverbook: slot.isOverbook,
    };
  }

  /**
   * @param {number} id
   * @param {string} status
   * @returns {Promise<void>}
   */
  async updateStatus(id, status) {
    await this.db.slot.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * @param {number} id
   * @param {number} patientId
   * @param {string} consultationReason
   * @returns {Promise<void>}
   */
  async reserve(id, patientId, consultationReason) {
    await this.db.slot.update({
      where: { id },
      data: {
        patientId,
        consultationReason,
        status: SlotStatus.PROPOSED,
      },
    });
  }

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async release(id) {
    await this.db.slot.update({
      where: { id },
      data: {
        patientId: null,
        consultationReason: null,
        status: SlotStatus.FREE,
      },
    });
  }

  /**
   * Counts active (non-CANCELLED) overbooks for a specific schedule and time.
   * @param {number} scheduleId
   * @param {Date} startsAt
   * @returns {Promise<number>}
   */
  async countActiveOverbooksByTime(scheduleId, startsAt) {
    return this.db.slot.count({
      where: {
        scheduleId,
        startsAt,
        isOverbook: true,
        status: { not: SlotStatus.CANCELLED },
      },
    });
  }

  /**
   * Counts active (non-CANCELLED) overbooks for a specific schedule within a day range.
   * @param {number} scheduleId
   * @param {Date} dayStart
   * @param {Date} dayEnd
   * @returns {Promise<number>}
   */
  async countActiveOverbooksByDay(scheduleId, dayStart, dayEnd) {
    return this.db.slot.count({
      where: {
        scheduleId,
        isOverbook: true,
        status: { not: SlotStatus.CANCELLED },
        startsAt: { gte: dayStart, lt: dayEnd },
      },
    });
  }

  /**
   * Creates a new overbook slot and returns its ID.
   * @param {import("../domain/slot.repository.js").CreateOverbookData} data
   * @returns {Promise<number>}
   */
  async createOverbook(data) {
    const slot = await this.db.slot.create({
      data: {
        scheduleId: data.scheduleId,
        startsAt: data.startsAt,
        patientId: data.patientId,
        consultationReason: data.consultationReason,
        isOverbook: true,
        status: SlotStatus.BOOKED,
      },
    });

    return slot.id;
  }

  /**
   * Finds the overbook limits for a schedule.
   * @param {number} scheduleId
   * @returns {Promise<import("../domain/slot.repository.js").ScheduleOverbookLimits | null>}
   */
  async findScheduleLimits(scheduleId) {
    const schedule = await this.db.schedule.findUnique({
      where: { id: scheduleId },
      select: {
        maxOverbooksPerSlot: true,
        maxOverbooksPerDay: true,
      },
    });

    return schedule;
  }
}
