import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when a user email is already in use.
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
 * Error thrown when a user is not found.
 */
export class UserNotFoundError extends CustomError {
  /**
   * @param {number} userId - The ID of the user that was not found.
   */
  constructor(userId) {
    super(`El usuario (ID: ${userId}) no existe.`, 404);
    this.userId = userId;
  }
}
