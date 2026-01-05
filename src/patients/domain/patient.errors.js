import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when a patient email is already in use.
 */
export class EmailAlreadyInUseError extends CustomError {
  /**
   * @param {string} email - The email that is already in use.
   */
  constructor(email) {
    super(`El email ${email} ya está en uso.`, 409);
    this.email = email;
  }
}

/**
 * Error thrown when a national ID is already in use by another user.
 */
export class NationalIdAlreadyInUseError extends CustomError {
  /**
   * @param {string} nationalId - The national ID that is already in use.
   * @param {string} role - The role of the user that already has this national ID.
   */
  constructor(nationalId, role) {
    super(
      `El DNI ${nationalId} está en uso por otro usuario con el rol ${role}.`,
      409
    );
    this.nationalId = nationalId;
    this.role = role;
  }
}

/**
 * Error thrown when a health insurance is not found.
 */
export class HealthInsuranceNotFoundError extends CustomError {
  /**
   * @param {string|number} insuranceId - The ID of the insurance that was not found.
   */
  constructor(insuranceId) {
    super(`La obra social (ID: ${insuranceId}) no existe`, 404);
    this.insuranceId = insuranceId;
  }
}

/**
 * Error thrown when a member number is already registered for a health insurance.
 */
export class MemberNumberDuplicateError extends CustomError {
  /**
   * @param {string} memberNumber - The member number that is duplicate.
   * @param {string} insuranceName - The name of the health insurance.
   */
  constructor(memberNumber, insuranceName) {
    super(
      `El número de afiliado ${memberNumber} ya está registrado para ${insuranceName}`,
      409
    );
    this.memberNumber = memberNumber;
    this.insuranceName = insuranceName;
  }
}

/**
 * Error thrown when a patient is not found.
 */
export class PatientNotFoundError extends CustomError {
  /**
   * @param {string} patientId - The ID of the patient that was not found.
   */
  constructor(patientId) {
    super(`No se encontró el paciente (ID: ${patientId}).`, 404);
    this.patientId = patientId;
  }
}
