import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Error thrown when authentication fails.
 */
export class InvalidCredentialsError extends CustomError {
  constructor() {
    super("El email y/o la contraseña son incorrectos.", 401);
  }
}

export class SessionMissingError extends CustomError {
  constructor() {
    super("Debes iniciar sesión para acceder.", 401);
  }
}

export class SessionInvalidError extends CustomError {
  constructor() {
    super("Sesión inválida o expirada.", 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor() {
    super("No tienes permisos para acceder aquí.", 403);
  }
}
