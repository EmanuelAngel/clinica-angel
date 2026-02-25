import { WaitingListEntry } from "../domain/waiting-list.model.js";

/**
 * @typedef {import("../domain/waiting-list.repository.js").WaitingListRepository} WaitingListRepository
 * @implements {WaitingListRepository}
 */
export class PrismaWaitingListRepository {
  /** @param {import("../../../generated/prisma/index.js").PrismaClient} prismaClient */
  constructor(prismaClient) {
    this.db = prismaClient;
  }

  /**
   * @param {number} patientId
   * @param {number | null} professionalId
   * @param {number | null} specialtyId
   * @returns {Promise<WaitingListEntry>}
   */
  async create(patientId, professionalId, specialtyId) {
    const created = await this.db.waitingList.create({
      data: {
        patientId,
        professionalId,
        specialtyId,
      },
      include: {
        patient: true,
        professional: true,
        specialty: true,
      },
    });

    return this._mapToDomain(created);
  }

  /**
   * @param {import("../domain/waiting-list.repository.js").WaitlistFilters} filters
   * @returns {Promise<import("../domain/waiting-list.repository.js").PaginatedWaitlist>}
   */
  async findAll(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const sort = filters.sort || "asc";
    const skip = (page - 1) * limit;

    /** @type {import("../../../generated/prisma/index.js").Prisma.WaitingListWhereInput} */
    const where = {};

    if (filters.professionalId) {
      where.professionalId = filters.professionalId;
    }
    if (filters.specialtyId) {
      where.specialtyId = filters.specialtyId;
    }

    const [data, total] = await Promise.all([
      this.db.waitingList.findMany({
        where,
        include: {
          patient: true,
          professional: true,
          specialty: true,
        },
        orderBy: { requestDate: sort },
        skip,
        take: limit,
      }),
      this.db.waitingList.count({ where }),
    ]);

    return {
      data: data.map((entry) => this._mapToDomain(entry)),
      total,
    };
  }

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async deleteById(id) {
    await this.db.waitingList.delete({
      where: { id },
    });
  }

  /**
   * @param {number} patientId
   * @param {number | null} professionalId
   * @param {number | null} specialtyId
   * @returns {Promise<boolean>}
   */
  async existsDuplicate(patientId, professionalId, specialtyId) {
    const existing = await this.db.waitingList.findFirst({
      where: {
        patientId,
        professionalId,
        specialtyId,
      },
    });
    return existing !== null;
  }

  /**
   * Maps a Prisma WaitingList record (with relations) to the domain model.
   * @param {import("../../../generated/prisma/index.js").Prisma.WaitingListGetPayload<{
   *   include: { patient: true, professional: true, specialty: true }
   * }>} raw
   * @returns {WaitingListEntry}
   * @private
   */
  _mapToDomain(raw) {
    return new WaitingListEntry({
      id: raw.id,
      patientId: raw.patientId,
      professionalId: raw.professionalId,
      specialtyId: raw.specialtyId,
      requestDate: raw.requestDate,
      patientName: `${raw.patient.firstNames} ${raw.patient.lastNames}`,
      patientDni: raw.patient.nationalId,
      patientPhone: raw.patient.phone,
      patientEmail: raw.patient.email,
      professionalName: raw.professional
        ? `${raw.professional.firstNames} ${raw.professional.lastNames}`
        : null,
      specialtyName: raw.specialty ? raw.specialty.name : null,
    });
  }
}
