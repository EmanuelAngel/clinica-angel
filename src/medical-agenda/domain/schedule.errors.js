import { CustomError } from "../../_shared/domain/custom-error.js";

export class ScheduleAlreadyExistsError extends CustomError {
  /**
   * @param {string} licenseNumber
   */
  constructor(licenseNumber) {
    super(
      `Ya existe una agenda activa para la matrícula "${licenseNumber}". Un profesional solo puede tener una agenda activa por especialidad.`,
      409
    );
  }
}

export class ScheduleOverlapError extends CustomError {
  /**
   * @param {string} dayOfWeek
   * @param {string} startTime
   * @param {string} endTime
   */
  constructor(dayOfWeek, startTime, endTime) {
    super(
      `El rango horario ${startTime} - ${endTime} del día ${dayOfWeek} se solapa con una configuración existente.`,
      409
    );
  }
}

export class InvalidTimeRangeError extends CustomError {
  constructor() {
    super(
      "La hora de fin debe ser estrictamente mayor a la hora de inicio.",
      400
    );
  }
}

export class InvalidValidityPeriodError extends CustomError {
  /**
   * @param {string} reason
   */
  constructor(reason) {
    super(`Período de vigencia inválido: ${reason}`, 400);
  }
}

export class LicenseNotFoundError extends CustomError {
  /**
   * @param {string} licenseNumber
   */
  constructor(licenseNumber) {
    super(`La matrícula "${licenseNumber}" no fue encontrada.`, 404);
  }
}

export class LocationNotFoundError extends CustomError {
  /**
   * @param {number} locationId
   */
  constructor(locationId) {
    super(`La sucursal con ID ${locationId} no fue encontrada.`, 404);
  }
}

export class ClassificationNotFoundError extends CustomError {
  /**
   * @param {number} classificationId
   */
  constructor(classificationId) {
    super(
      `La clasificación con ID ${classificationId} no fue encontrada.`,
      404
    );
  }
}
