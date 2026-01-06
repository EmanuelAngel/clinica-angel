import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when a specialty is not found.
 */
export class SpecialtyNotFoundError extends CustomError {
  /**
   * @param {number} specialtyId - The ID of the specialty that was not found.
   */
  constructor(specialtyId) {
    super(`La especialidad (ID: ${specialtyId}) no existe.`, 404);
    this.specialtyId = specialtyId;
  }
}

/**
 * Error thrown when a specialty with the same name already exists.
 */
export class SpecialtyAlreadyExistsError extends CustomError {
  /**
   * @param {string} name - The name of the specialty that already exists.
   */
  constructor(name) {
    super(`La especialidad "${name}" ya existe.`, 409);
    this.name = name;
  }
}
