import {
  Professional,
  ProfessionalCredential,
} from "../domain/professional.model.js";
import { Roles } from "../../auth/domain/roles.js";

/**
 * @typedef {import("../domain/professional.repository.js").ProfessionalRepository} ProfessionalRepository
 * @implements {ProfessionalRepository}
 */
export class PrismaProfessionalRepository {
  /**
   * @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient
   */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * Find all active professionals.
   * @returns {Promise<Professional[]>} All active professionals.
   */
  async findAll() {
    const rawProfessionals = await this.db.user.findMany({
      where: {
        role: Roles.PROFESSIONAL,
        deletedAt: null,
      },
      include: {
        professionalCredentials: {
          include: {
            specialty: true,
          },
        },
      },
      orderBy: {
        lastNames: "asc",
      },
    });

    return rawProfessionals.map((fromPrisma) => this.mapToDomain(fromPrisma));
  }

  /**
   * Find professional by user ID.
   * @param {number} id - User ID.
   * @returns {Promise<Professional | null>}
   */
  async findById(id) {
    const rawProfessional = await this.db.user.findUnique({
      where: {
        id,
        role: Roles.PROFESSIONAL,
      },
      include: {
        professionalCredentials: {
          include: {
            specialty: true,
          },
        },
      },
    });

    if (!rawProfessional) {
      return null;
    }

    return this.mapToDomain(rawProfessional);
  }

  /**
   * Find credential by license number.
   * @param {string} licenseNumber
   * @returns {Promise<ProfessionalCredential | null>}
   */
  async findByLicenseNumber(licenseNumber) {
    const rawCredential = await this.db.professionalSpecialty.findUnique({
      where: { licenseNumber },
      include: {
        specialty: true,
      },
    });

    if (!rawCredential) {
      return null;
    }

    return new ProfessionalCredential(
      rawCredential.licenseNumber,
      rawCredential.specialtyId,
      rawCredential.specialty.name
    );
  }

  /**
   * Create a new professional with user data and hashed password.
   * @param {Professional} professional - The professional domain model.
   * @param {string} passwordHash - Hashed password.
   * @returns {Promise<Professional>} The created professional.
   */
  async create(professional, passwordHash) {
    const created = await this.db.user.create({
      data: {
        email: professional.email,
        passwordHash,
        role: Roles.PROFESSIONAL,
        firstNames: professional.firstNames,
        lastNames: professional.lastNames,
        nationalId: professional.nationalId,
        phone: professional.phone,
        address: professional.address,
        professionalCredentials: {
          create: professional.credentials.map((cred) => ({
            licenseNumber: cred.licenseNumber,
            specialtyId: cred.specialtyId,
          })),
        },
      },
      include: {
        professionalCredentials: {
          include: {
            specialty: true,
          },
        },
      },
    });

    return this.mapToDomain(created);
  }

  /**
   * Add a specialty credential to a professional.
   * @param {number} userId
   * @param {number} specialtyId
   * @param {string} licenseNumber
   * @returns {Promise<ProfessionalCredential>}
   */
  async addSpecialty(userId, specialtyId, licenseNumber) {
    const created = await this.db.professionalSpecialty.create({
      data: {
        licenseNumber,
        userId,
        specialtyId,
      },
      include: {
        specialty: true,
      },
    });

    return new ProfessionalCredential(
      created.licenseNumber,
      created.specialtyId,
      created.specialty.name
    );
  }

  /**
   * Find professional by ID with deep nested slots for agenda display.
   * @param {number} id - User ID.
   * @returns {Promise<any | null>} Raw Prisma result with nested relations.
   */
  async findByIdWithSlots(id) {
    return this.db.user.findUnique({
      where: {
        id,
        role: Roles.PROFESSIONAL,
      },
      include: {
        professionalCredentials: {
          include: {
            specialty: true,
            schedules: {
              include: {
                classification: true,
                slots: {
                  where: {
                    patientId: { not: null },
                  },
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
                  },
                  orderBy: {
                    startsAt: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Maps a Prisma user (with professionalCredentials) to a Professional domain model.
   * @param {import("../../../generated/prisma/index.js").Prisma.UserGetPayload<{
   *   include: { professionalCredentials: { include: { specialty: true } } }
   * }>} fromPrisma
   * @returns {Professional}
   */
  mapToDomain(fromPrisma) {
    return new Professional({
      id: fromPrisma.id,
      email: fromPrisma.email,
      firstNames: fromPrisma.firstNames,
      lastNames: fromPrisma.lastNames,
      nationalId: fromPrisma.nationalId,
      phone: fromPrisma.phone,
      address: fromPrisma.address,
      deletedAt: fromPrisma.deletedAt,
      credentials: fromPrisma.professionalCredentials.map(
        (cred) =>
          new ProfessionalCredential(
            cred.licenseNumber,
            cred.specialtyId,
            cred.specialty.name
          )
      ),
    });
  }
}
