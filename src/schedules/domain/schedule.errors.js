import { CustomError } from "../../_shared/domain/custom-error.js";

export class ScheduleAlreadyActiveError extends CustomError {
  constructor() {
    super(
      "El profesional ya posee una agenda activa para esta especialidad.",
      409
    );
  }
}

export class ScheduleOverlapError extends CustomError {
  /**
   *
   * @param {string} newDay "MONDAY", "TUESDAY", etc.
   * @param {{ start: string, end: string }} newRange { start: "08:00", end: "12:00" }
   * @param {import('./schedule.model.js').ScheduleConfig} existingConfig
   */
  constructor(newDay, newRange, existingConfig) {
    super();
    this.message = `El horario del día ${newDay} (${newRange.start}–${newRange.end}) se solapa con una agenda existente (${existingConfig.startTime}–${existingConfig.endTime}).`;
    this.statusCode = 409;
  }
}

export class SlotStartDateCannotBeAfterEndDateError extends CustomError {
  constructor() {
    super(
      "La fecha de inicio del turno no puede ser posterior a la fecha de fin.",
      422
    );
  }
}

export class SlotDurationCannotBeZeroError extends CustomError {
  constructor() {
    super("La duración del turno debe ser mayor a 0 minutos.", 422);
  }
}

export class ScheduleNotFoundError extends CustomError {
  /**
   * @param {number} id
   */
  constructor(id) {
    super(`No se encontró la agenda con ID ${id}.`, 404);
  }
}
