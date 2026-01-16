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
    this.message = `
      Conflicto detectado: El día ${newDay} intentas agendar de
      ${newRange.start} a ${newRange.end}, pero ya existe una agenda de ${existingConfig.startTime} a
      ${existingConfig.endTime}.
    `;
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
