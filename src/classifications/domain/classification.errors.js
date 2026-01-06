import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when a classification is not found.
 */
export class ClassificationNotFoundError extends CustomError {
  /**
   * @param {number} classificationId - The ID of the classification that was not found.
   */
  constructor(classificationId) {
    super(`La clasificación (ID: ${classificationId}) no existe.`, 404);
    this.classificationId = classificationId;
  }
}

/**
 * Error thrown when a classification with the same name already exists.
 */
export class ClassificationAlreadyExistsError extends CustomError {
  /**
   * @param {string} name - The name of the classification that already exists.
   */
  constructor(name) {
    super(`La clasificación "${name}" ya existe.`, 409);
    this.name = name;
  }
}
