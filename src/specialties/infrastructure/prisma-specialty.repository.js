import { Specialty } from "../domain/specialty.model.js";

/**
 * @typedef {import("../domain/specialty.repository.js").SpecialtyRepository} SpecialtyRepository
 * @implements {SpecialtyRepository}
 */
export class PrismaSpecialtyRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * Find all active specialties.
   * @returns {Promise<Specialty[]>} All active specialties.
   */
  async findAll() {
    const rawSpecialties = await this.db.specialty.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
    });

    return rawSpecialties.map((fromPrisma) => this.mapToDomain(fromPrisma));
  }

  /**
   * Find specialty by ID.
   * @param {number} id
   * @returns {Promise<Specialty | null>}
   */
  async findById(id) {
    const rawSpecialty = await this.db.specialty.findUnique({
      where: { id },
    });

    if (!rawSpecialty) {
      return null;
    }

    return this.mapToDomain(rawSpecialty);
  }

  /**
   * Find specialty by name.
   * Names are stored in lowercase, so we lowercase the input for comparison.
   * @param {string} name
   * @returns {Promise<Specialty | null>}
   */
  async findByName(name) {
    const rawSpecialty = await this.db.specialty.findFirst({
      where: {
        name: name.trim().toLowerCase(),
      },
    });

    if (!rawSpecialty) {
      return null;
    }

    return this.mapToDomain(rawSpecialty);
  }

  /**
   * Create a new specialty.
   * @param {Specialty} specialty
   * @returns {Promise<Specialty>}
   */
  async create(specialty) {
    const created = await this.db.specialty.create({
      data: {
        name: specialty.name,
      },
    });

    return this.mapToDomain(created);
  }

  /**
   * Maps a database model to a domain model.
   * @param {import("../../../generated/prisma/index.js").Prisma.SpecialtyGetPayload<true>} fromPrisma
   * @returns {Specialty}
   */
  mapToDomain(fromPrisma) {
    return new Specialty(fromPrisma.id, fromPrisma.name, fromPrisma.deletedAt);
  }
}
