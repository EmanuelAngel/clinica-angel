import { CustomError } from "../../_shared/domain/custom-error.js";

export class PatientNotFoundByDniError extends CustomError {
  /** @param {string} dni */
  constructor(dni) {
    super(`No se encontró un paciente con DNI: ${dni}`, 404);
  }
}

export class DuplicateWaitlistEntryError extends CustomError {
  constructor() {
    super(
      "El paciente ya se encuentra en la lista de espera con la misma combinación de profesional y especialidad.",
      409
    );
  }
}

export class WaitlistEntryNotFoundError extends CustomError {
  /** @param {number} id */
  constructor(id) {
    super(`No se encontró la entrada de lista de espera con ID: ${id}`, 404);
  }
}

export class InvalidWaitlistAssignmentError extends CustomError {
  constructor() {
    super("Debe especificar al menos un profesional o una especialidad.", 422);
  }
}
