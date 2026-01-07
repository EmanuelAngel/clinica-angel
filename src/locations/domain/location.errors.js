import { CustomError } from "../../_shared/domain/custom-error.js";

export class LocationNotFoundError extends CustomError {
  constructor() {
    super("La sucursal no fue encontrada", 404);
  }
}

export class LocationNameAlreadyExistsError extends CustomError {
  /**
   * @param {string} name
   */
  constructor(name) {
    super(`Ya existe una sucursal con el nombre "${name}"`, 409);
  }
}
