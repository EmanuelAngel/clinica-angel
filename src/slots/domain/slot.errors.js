import { CustomError } from "../../_shared/domain/custom-error.js";

/**
 * Slot not found in the database.
 */
export class SlotNotFoundError extends CustomError {
  /**
   * @param {number} id
   */
  constructor(id) {
    super(`No se encontró el turno con ID ${id}.`, 404);
  }
}

/**
 * Invalid state transition attempted.
 */
export class InvalidTransitionError extends CustomError {
  /**
   * @param {string} currentStatus
   * @param {string} action
   */
  constructor(currentStatus, action) {
    super(
      `No se puede ejecutar la acción "${action}" desde el estado "${currentStatus}".`,
      422
    );
  }
}

/**
 * Only ADMIN can modify past slots.
 */
export class PastSlotModificationForbiddenError extends CustomError {
  constructor() {
    super("Solo administradores pueden gestionar turnos pasados.", 403);
  }
}

/**
 * PATIENT requires 48h lead time to reserve.
 */
export class InsufficientLeadTimeError extends CustomError {
  constructor() {
    super("Requiere 48h de anticipación para reservar un turno.", 422);
  }
}

/**
 * Consultation reason is required and must be at least 5 characters.
 */
export class ConsultationReasonRequiredError extends CustomError {
  constructor() {
    super(
      "El motivo de consulta es obligatorio y debe tener al menos 5 caracteres.",
      422
    );
  }
}

/**
 * FULFILLED state is terminal and immutable.
 */
export class FulfilledSlotImmutableError extends CustomError {
  constructor() {
    super("Un turno atendido no puede ser modificado.", 422);
  }
}

/**
 * User role is not authorized to perform this action.
 */
export class UnauthorizedSlotActionError extends CustomError {
  /**
   * @param {string} action
   */
  constructor(action) {
    super(`No tiene permisos para ejecutar la acción "${action}".`, 403);
  }
}

/**
 * Slot is not in FREE status for reservation.
 */
export class SlotNotFreeError extends CustomError {
  constructor() {
    super("El turno no está disponible para reservar.", 422);
  }
}

/**
 * Source slot is not in BOOKED status for overbook creation.
 */
export class OverbookSlotNotBookedError extends CustomError {
  constructor() {
    super(
      "Solo se pueden crear sobreturnos a partir de turnos en estado Propuesto.",
      422
    );
  }
}

/**
 * Per-slot overbook limit reached.
 */
export class OverbookPerSlotLimitError extends CustomError {
  constructor() {
    super("Se alcanzó el límite de sobreturnos para este horario.", 422);
  }
}

/**
 * Per-day overbook limit reached.
 */
export class OverbookPerDayLimitError extends CustomError {
  constructor() {
    super("Se alcanzó el límite de sobreturnos para este día.", 422);
  }
}
