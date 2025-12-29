import { User } from "../domain/user.model.js";

/** @typedef {import("../../../generated/prisma/index.js").Prisma.UserGetPayload<true>} PrismaUser */
/** @typedef {import("../../auth/domain/roles.js").Role} Role */

/**
 * @typedef {import("../domain/user.repository.js").UserRepository} UserRepository
 * @implements {UserRepository}
 */
export class PrismaUserRepository {
  /** @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * Find a user by email.
   * @param {string} email The user email to find.
   * @returns {Promise<null | User>} The user or null.
   */
  async findByEmail(email) {
    const rawUser = await this.db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!rawUser) {
      return null;
    }

    return this.mapToDomain(rawUser);
  }

  async findAll() {
    const rawUsers = await this.db.user.findMany();

    return rawUsers.map((fromPrisma) => this.mapToDomain(fromPrisma));
  }

  /**
   * @param {string} nationalId
   * @param {Role} role
   * @returns {Promise<null | User>} The user or null.
   */
  async findByNationalIdAndRole(nationalId, role) {
    const rawUser = await this.db.user.findFirst({
      where: {
        nationalId: nationalId,
        role: role,
      },
    });

    if (!rawUser) {
      return null;
    }

    return this.mapToDomain(rawUser);
  }

  /**
   * @param {User} user The user to register.
   */
  async register(user) {
    await this.db.user.create({
      data: {
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        role: /** @type {Role} */ (user.role),
        firstNames: user.firstNames,
        lastNames: user.lastNames,
        nationalId: user.nationalId,
        phone: user.phone,
        address: user.address,
        nationalIdImageUrl: null,
        registeredAt: user.registeredAt,
        deletedAt: user.deletedAt,
      },
    });
  }

  /**
   * Get a user by ID.
   * @param {number} id User ID.
   * @returns {Promise<null | User>} The user or null.
   */
  async findById(id) {
    const rawUser = await this.db.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!rawUser) {
      return null;
    }

    return this.mapToDomain(rawUser);
  }

  /**
   * Maps a Prisma user to the domain model.
   * @param {PrismaUser} fromPrisma
   * @returns {User} The domain model.
   */
  mapToDomain(fromPrisma) {
    return new User({
      id: fromPrisma.id,
      email: fromPrisma.email,
      passwordHash: fromPrisma.passwordHash,
      role: fromPrisma.role,
      firstNames: fromPrisma.firstNames,
      lastNames: fromPrisma.lastNames,
      nationalId: fromPrisma.nationalId,
      phone: fromPrisma.phone,
      address: fromPrisma.address,
      registeredAt: fromPrisma.registeredAt,
      deletedAt: fromPrisma.deletedAt,
    });
  }
}
