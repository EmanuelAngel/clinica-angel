/**
 * @typedef {import('../../specialties/domain/specialty.model.js').Specialty} Specialty
 */

/**
 * Represents a professional's credential for a specific specialty.
 */
export class ProfessionalCredential {
  /**
   * @param {string} licenseNumber - Professional license number.
   * @param {number} specialtyId - ID of the specialty.
   * @param {string} specialtyName - Name of the specialty.
   */
  constructor(licenseNumber, specialtyId, specialtyName) {
    this.licenseNumber = licenseNumber;
    this.specialtyId = specialtyId;
    this.specialtyName = specialtyName;
  }
}

/**
 * Represents a health professional (doctor, etc.).
 * Extends the base User with specialty credentials.
 */
export class Professional {
  /**
   * @param {object} params
   * @param {number} params.id - User ID.
   * @param {string} params.email
   * @param {string} params.firstNames
   * @param {string} params.lastNames
   * @param {string} params.nationalId
   * @param {string} params.phone
   * @param {string} params.address
   * @param {Date | null} params.deletedAt
   * @param {ProfessionalCredential[]} params.credentials - Specialty credentials.
   */
  constructor({
    id,
    email,
    firstNames,
    lastNames,
    nationalId,
    phone,
    address,
    deletedAt = null,
    credentials = [],
  }) {
    this.id = id;
    this.email = email;
    this.firstNames = firstNames;
    this.lastNames = lastNames;
    this.nationalId = nationalId;
    this.phone = phone;
    this.address = address;
    this.deletedAt = deletedAt;
    this.credentials = credentials;
  }

  /**
   * Get the full name of the professional.
   * @returns {string} Full name.
   */
  get fullName() {
    return `${this.firstNames} ${this.lastNames}`;
  }

  /**
   * Check if the professional is active.
   * @returns {boolean} True if active.
   */
  get isActive() {
    return this.deletedAt === null;
  }
}
