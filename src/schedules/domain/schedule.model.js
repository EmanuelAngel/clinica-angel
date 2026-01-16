import { CustomError } from "../../_shared/domain/custom-error.js";
import { SlotStatus } from "./slot-status.js";

/**
 * @typedef {object} ScheduleConfigProps
 * @property {string} dayOfWeek - MONDAY, TUESDAY, etc.
 * @property {string} startTime - "09:00"
 * @property {string} endTime - "17:00"
 * @property {Date} validFrom - The date the schedule starts.
 * @property {Date} validUntil - The date the schedule ends.
 */

export class ScheduleConfig {
  /**
   * @param {ScheduleConfigProps} props
   */
  constructor({ dayOfWeek, startTime, endTime, validFrom, validUntil }) {
    if (startTime >= endTime) {
      throw new CustomError(
        `Configuración inválida para ${dayOfWeek}: El inicio (${startTime}) debe ser anterior al fin (${endTime}).`,
        422
      );
    }
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.validFrom = validFrom;
    this.validUntil = validUntil;
  }
}

/**
 * @typedef {object} ScheduleBlockProps
 * @property {Date} startDate The date the block starts.
 * @property {Date} endDate The date the block ends.
 * @property {string} reason The reason/motive for the block.
 */

export class ScheduleBlock {
  /**
   * @param {ScheduleBlockProps} props
   */
  constructor({ startDate, endDate, reason }) {
    if (startDate > endDate) {
      throw new CustomError(
        "El bloqueo no puede terminar antes de empezar.",
        422
      );
    }
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
  }
}

/**
 * @typedef {object} ScheduleProps
 * @property {number?} id The schedule ID.
 * @property {string} professionalLicense License number that allows the professional to practice.
 * @property {number} locationId Location ID where the schedule is taking place.
 * @property {number} classificationId Classification ID of the schedule.
 * @property {number} slotDurationMinutes Duration of each slot in minutes.
 * @property {number} maxOverbooksPerDay Max number of overbooks allowed per day.
 * @property {number} maxOverbooksPerSlot Max number of overbooks allowed per slot.
 * @property {boolean} isPaused Not deleted, but all slots are deleted.
 * @property {Date?} deletedAt Deactivation date.
 * @property {ScheduleConfig[]} [configs] Schedule configuration. Days and time ranges.
 * @property {ScheduleBlock[]} [blocks] Periods of time where the schedule won't generate slots and why.
 */

export class Schedule {
  /**
   * @param {ScheduleProps} props
   */
  constructor({
    id,
    professionalLicense,
    locationId,
    classificationId,
    slotDurationMinutes,
    maxOverbooksPerDay,
    maxOverbooksPerSlot,
    isPaused = false,
    deletedAt = null,
    configs = [],
    blocks = [],
  }) {
    this.ensurePositiveInteger(slotDurationMinutes, "La duración del turno");
    this.ensureNonNegativeInteger(
      maxOverbooksPerDay,
      "El máximo de sobreturnos por día"
    );

    this.id = id;
    this.professionalLicense = professionalLicense;
    this.locationId = locationId;
    this.classificationId = classificationId;
    this.slotDurationMinutes = slotDurationMinutes;
    this.maxOverbooksPerDay = maxOverbooksPerDay;
    this.maxOverbooksPerSlot = maxOverbooksPerSlot;
    this.isPaused = isPaused;
    this.deletedAt = deletedAt;

    /** @type {ScheduleConfig[]} */
    this.configs = configs;

    /** @type {ScheduleBlock[]} */
    this.blocks = blocks;
  }

  /**
   * @param {number} value
   * @param {string} fieldName
   */
  ensurePositiveInteger(value, fieldName) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new CustomError(
        `${fieldName} debe ser un número entero positivo.`,
        422
      );
    }
  }

  /**
   * @param {number} value
   * @param {string} fieldName
   */
  ensureNonNegativeInteger(value, fieldName) {
    if (!Number.isInteger(value) || value < 0) {
      throw new CustomError(`${fieldName} no puede ser negativo.`, 422);
    }
  }

  isActive() {
    return !this.deletedAt;
  }
}

export class Slot {
  /**
   * @param {object} props
   * @param {Date} props.startsAt
   * @param {number} [props.scheduleId]
   * @param {SlotStatus} [props.status]
   */
  constructor({ startsAt, scheduleId, status = SlotStatus.FREE }) {
    this.startsAt = startsAt;
    this.scheduleId = scheduleId;
    this.status = status;
  }
}
