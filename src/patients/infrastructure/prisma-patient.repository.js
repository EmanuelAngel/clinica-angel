import { CustomError } from "../../_shared/domain/custom-error.js";
import { Roles } from "../../auth/domain/roles.js";
import { HealthInsurance } from "../../health-insurances/domain/health-insurance.model.js";
import { Patient, PatientHealthInsurance } from "../domain/patient.model.js";

/**
 * @typedef {import("../../../generated/prisma/index.js").Prisma.UserGetPayload<{
 *     include: { patientInsurances: { include: { insurance: true } } };
 *   }>} UserWithInsurances
 */

/**
 * @typedef {import("../domain/patient.repository.js").PatientRepository} PatientRepository
 * @implements {PatientRepository}
 */
export class PrismaPatientRepository {
  /** @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * @param {string} email
   */
  async findByEmail(email) {
    const rawUser = await this.db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      include: {
        patientInsurances: {
          include: {
            insurance: true,
          },
        },
      },
    });

    if (!rawUser) {
      return null;
    }

    return this.mapToDomain(rawUser);
  }

  /**
   * @param {string} id
   * @returns {Promise<null | Patient>} The patient or null.
   */
  async findById(id) {
    const rawUser = await this.db.user.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      include: {
        patientInsurances: {
          include: {
            insurance: true,
          },
        },
      },
    });

    if (!rawUser) {
      return null;
    }

    return this.mapToDomain(rawUser);
  }

  /**
   * @param {Patient} data
   */
  async register(data) {
    await this.db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: Roles.PATIENT,
          nationalId: data.nationalId,
          firstNames: data.firstNames,
          lastNames: data.lastNames,
          phone: data.phone,
          address: data.address,
          nationalIdImageUrl: data.nationalIdImageUrl,
          registeredAt: data.registeredAt,
          deletedAt: data.deletedAt,
        },
      });

      for (const insurance of data.healthInsurances) {
        await tx.patientHealthInsurance.create({
          data: {
            userId: newUser.id,
            insuranceId: insurance.insuranceId,
            memberNumber: insurance.memberNumber,
          },
        });
      }
    });
  }

  async findAll() {
    const rawUsers = await this.db.user.findMany({
      where: {
        role: Roles.PATIENT,
      },
      include: {
        patientInsurances: {
          include: {
            insurance: true,
          },
        },
      },
    });

    return rawUsers.map((fromPrisma) => this.mapToDomain(fromPrisma));
  }

  /**
   * Deactivates a patient (soft delete). Only sets deletedAt field.
   * @param {string} id User ID to deactivate.
   */
  async deactivate(id) {
    await this.db.user.update({
      where: {
        id: parseInt(id, 10),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   *
   * @param {number} insuranceId
   * @param {string} memberNumber
   */
  async existsMemberNumber(insuranceId, memberNumber) {
    const count = await this.db.patientHealthInsurance.count({
      where: {
        insuranceId: insuranceId,
        memberNumber: memberNumber,
      },
    });
    return count > 0;
  }

  /**
   * Find a patient by national ID (DNI).
   * @param {string} nationalId
   * @returns {Promise<null | Patient>}
   */
  async findByNationalId(nationalId) {
    const rawUser = await this.db.user.findFirst({
      where: {
        nationalId,
        role: Roles.PATIENT,
      },
      include: {
        patientInsurances: {
          include: {
            insurance: true,
          },
        },
      },
    });

    if (!rawUser) {
      return null;
    }

    return this.mapToDomain(rawUser);
  }

  /**
   * Maps a database model to a domain model.
   * @param {UserWithInsurances} fromPrisma Prisma user with insurances.
   * @returns {Patient} The domain model.
   */
  mapToDomain(fromPrisma) {
    if (!fromPrisma.nationalIdImageUrl) {
      throw new CustomError(
        `Encontrado paciente sin imagen de DNI: ${fromPrisma.email}`,
        422
      );
    }

    return new Patient({
      id: fromPrisma.id,
      email: fromPrisma.email,
      passwordHash: fromPrisma.passwordHash,
      role: fromPrisma.role,
      nationalId: fromPrisma.nationalId,
      firstNames: fromPrisma.firstNames,
      lastNames: fromPrisma.lastNames,
      phone: fromPrisma.phone,
      address: fromPrisma.address,
      registeredAt: fromPrisma.registeredAt,
      deletedAt: fromPrisma.deletedAt,
      nationalIdImageUrl: fromPrisma.nationalIdImageUrl,
      healthInsurances: fromPrisma.patientInsurances.map((patientInsurance) => {
        return new PatientHealthInsurance(
          new HealthInsurance(
            patientInsurance.insuranceId,
            patientInsurance.insurance.name,
            patientInsurance.insurance.deletedAt
          ),
          patientInsurance.memberNumber
        );
      }),
    });
  }
}
