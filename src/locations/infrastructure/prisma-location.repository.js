import { Location } from "../domain/location.model.js";

/**
 * @implements {import("../domain/location.repository.js").LocationRepository}
 */
export class PrismaLocationRepository {
  /**
   * @param {import("@prisma/client").PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * @param {Omit<Location, "id" | "deletedAt">} data
   * @returns {Promise<Location>} The created location.
   */
  async create(data) {
    const created = await this.prisma.location.create({
      data,
    });
    return new Location(created);
  }

  /**
   * @returns {Promise<Location[]>} The list of locations.
   */
  async findAll() {
    const locations = await this.prisma.location.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
    });
    return locations.map(
      (/** @type {import("../domain/location.model.js").Location} */ l) =>
        new Location(l)
    );
  }

  /**
   * @param {number} id
   * @returns {Promise<Location | null>} The location or null if not found.
   */
  async findById(id) {
    const found = await this.prisma.location.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    return found ? new Location(found) : null;
  }

  /**
   * @param {string} name
   * @returns {Promise<Location | null>} The location or null if not found.
   */
  async findByName(name) {
    const found = await this.prisma.location.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });

    return found ? new Location(found) : null;
  }

  /**
   * @param {number} id
   * @param {Partial<Omit<Location, "id" | "deletedAt">>} data
   * @returns {Promise<Location>} The updated location.
   */
  async update(id, data) {
    const updated = await this.prisma.location.update({
      where: { id },
      data,
    });
    return new Location(updated);
  }
}
