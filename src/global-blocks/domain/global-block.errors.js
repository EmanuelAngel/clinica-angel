import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when a global block is not found.
 */
export class GlobalBlockNotFoundError extends CustomError {
  /**
   * @param {number} blockId
   */
  constructor(blockId) {
    super(`El bloqueo global (ID: ${blockId}) no existe.`, 404);
    this.blockId = blockId;
  }
}

/**
 * Error thrown when attempting to create, update, or delete a global block
 * whose dates are in the past.
 */
export class GlobalBlockInPastError extends CustomError {
  constructor() {
    super(
      "No se puede crear, modificar o eliminar un bloqueo con fechas en el pasado.",
      422
    );
  }
}
