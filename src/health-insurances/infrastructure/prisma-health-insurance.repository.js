import { HealthInsurance } from "../domain/health-insurance.model.js";

/**
 * @typedef {import("../domain/health-insurance.repository.js").HealthInsuranceRepository} HealthInsuranceRepository
 * @implements {HealthInsuranceRepository}
 */
export class PrismaHealthInsuranceRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * Find all health insurances or return an empty array.
   * @param {{ includeDeleted?: boolean }} options
   * @returns {Promise<import("../domain/health-insurance.model.js").HealthInsurance[]>} All health insurances.
   */
  async findAll(options = { includeDeleted: false }) {
    const where = options.includeDeleted ? {} : { deletedAt: null };
    const rawHealthInsurances = await this.db.healthInsurance.findMany({
      where,
    });

    return rawHealthInsurances.map((fromPrisma) =>
      this.mapToDomain(fromPrisma)
    );
  }

  /**
   * @param {number} id
   */
  async findById(id) {
    const rawHealthInsurance = await this.db.healthInsurance.findUnique({
      where: {
        id,
      },
    });

    if (!rawHealthInsurance) {
      return null;
    }

    return this.mapToDomain(rawHealthInsurance);
  }

  /**
   * Maps a database model to a domain model.
   * @param {import("../../../generated/prisma/index.js").Prisma.HealthInsuranceGetPayload<true>} fromPrisma Prisma health insurance.
   * @returns {import("../domain/health-insurance.model.js").HealthInsurance} The domain model.
   */
  mapToDomain(fromPrisma) {
    return new HealthInsurance(
      fromPrisma.id,
      fromPrisma.name,
      fromPrisma.deletedAt
    );
  }
}
