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
}
