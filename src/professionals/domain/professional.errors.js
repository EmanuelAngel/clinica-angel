import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when a professional is not found.
 */
export class ProfessionalNotFoundError extends CustomError {
  /**
   * @param {number} professionalId - The ID of the professional that was not found.
   */
  constructor(professionalId) {
    super(`El profesional (ID: ${professionalId}) no existe.`, 404);
    this.professionalId = professionalId;
  }
}

/**
 * Error thrown when a license number is already in use.
 */
export class LicenseAlreadyExistsError extends CustomError {
  /**
   * @param {string} licenseNumber - The license number that already exists.
   */
  constructor(licenseNumber) {
    super(`El número de matrícula "${licenseNumber}" ya está registrado.`, 409);
    this.licenseNumber = licenseNumber;
  }
}

/**
 * Error thrown when a specialty is not found for a credential.
 */
export class CredentialSpecialtyNotFoundError extends CustomError {
  /**
   * @param {number} specialtyId - The ID of the specialty that was not found.
   */
  constructor(specialtyId) {
    super(`La especialidad (ID: ${specialtyId}) no existe.`, 400);
    this.specialtyId = specialtyId;
  }
}
