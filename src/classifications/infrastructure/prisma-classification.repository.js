import { Classification } from "../domain/classification.model.js";

/**
 * @typedef {import("../domain/classification.repository.js").ClassificationRepository} ClassificationRepository
 * @implements {ClassificationRepository}
 */
export class PrismaClassificationRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * Find all classifications.
   * @returns {Promise<Classification[]>} All classifications.
   */
  async findAll() {
    const rawClassifications = await this.db.classification.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return rawClassifications.map((fromPrisma) => this.mapToDomain(fromPrisma));
  }

  /**
   * Find classification by ID.
   * @param {number} id
   * @returns {Promise<Classification | null>}
   */
  async findById(id) {
    const rawClassification = await this.db.classification.findUnique({
      where: { id },
    });

    if (!rawClassification) {
      return null;
    }

    return this.mapToDomain(rawClassification);
  }

  /**
   * Find classification by name.
   * Names are stored in lowercase, so we lowercase the input for comparison.
   * @param {string} name
   * @returns {Promise<Classification | null>}
   */
  async findByName(name) {
    const rawClassification = await this.db.classification.findFirst({
      where: {
        name: name.trim().toLowerCase(),
      },
    });

    if (!rawClassification) {
      return null;
    }

    return this.mapToDomain(rawClassification);
  }

  /**
   * Create a new classification.
   * @param {Classification} classification
   * @returns {Promise<Classification>}
   */
  async create(classification) {
    const created = await this.db.classification.create({
      data: {
        name: classification.name.toLowerCase(),
      },
    });

    return this.mapToDomain(created);
  }

  /**
   * Update an existing classification.
   * @param {number} id
   * @param {Partial<Classification>} data
   * @returns {Promise<Classification>}
   */
  async update(id, data) {
    const updateData = {};

    if (data.name) {
      updateData.name = data.name.toLowerCase();
    }

    const updated = await this.db.classification.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDomain(updated);
  }

  /**
   * Delete a classification by ID.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.db.classification.delete({
      where: { id },
    });
  }

  /**
   * Maps a database model to a domain model.
   * @param {import("../../../generated/prisma/index.js").Prisma.ClassificationGetPayload<true>} fromPrisma
   * @returns {Classification}
   */
  mapToDomain(fromPrisma) {
    return new Classification(fromPrisma.id, fromPrisma.name);
  }
}
