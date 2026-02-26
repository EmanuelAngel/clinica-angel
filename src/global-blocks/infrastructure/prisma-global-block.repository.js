import { GlobalBlock } from "../domain/global-block.model.js";

/**
 * @typedef {import("../domain/global-block.repository.js").GlobalBlockRepository} GlobalBlockRepository
 * @implements {GlobalBlockRepository}
 */
export class PrismaGlobalBlockRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * Find all global blocks (scheduleId is null), ordered by start date ascending.
   * @returns {Promise<GlobalBlock[]>}
   */
  async findAll() {
    const blocks = await this.db.scheduleBlock.findMany({
      where: { scheduleId: null },
      orderBy: { startDate: "asc" },
    });

    return blocks.map((b) => this.mapToDomain(b));
  }

  /**
   * Find a global block by ID.
   * @param {number} id
   * @returns {Promise<GlobalBlock | null>}
   */
  async findById(id) {
    const block = await this.db.scheduleBlock.findFirst({
      where: { id, scheduleId: null },
    });

    if (!block) {
      return null;
    }

    return this.mapToDomain(block);
  }

  /**
   * Create a new global block (scheduleId is null).
   * @param {{ startDate: Date, endDate: Date, reason: string }} data
   * @returns {Promise<GlobalBlock>}
   */
  async create(data) {
    const created = await this.db.scheduleBlock.create({
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        scheduleId: null,
      },
    });

    return this.mapToDomain(created);
  }

  /**
   * Update an existing global block.
   * @param {number} id
   * @param {{ startDate: Date, endDate: Date, reason: string }} data
   * @returns {Promise<GlobalBlock>}
   */
  async update(id, data) {
    const updated = await this.db.scheduleBlock.update({
      where: { id },
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      },
    });

    return this.mapToDomain(updated);
  }

  /**
   * Delete a global block by ID.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.db.scheduleBlock.delete({
      where: { id },
    });
  }

  /**
   * Maps a Prisma schedule_block row to a GlobalBlock domain model.
   * @param {import("../../../generated/prisma/index.js").Prisma.ScheduleBlockGetPayload<true>} fromPrisma
   * @returns {GlobalBlock}
   */
  mapToDomain(fromPrisma) {
    return new GlobalBlock({
      id: fromPrisma.id,
      startDate: fromPrisma.startDate,
      endDate: fromPrisma.endDate,
      reason: fromPrisma.reason,
    });
  }
}
