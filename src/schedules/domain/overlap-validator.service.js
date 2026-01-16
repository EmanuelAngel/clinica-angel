import { ok, err } from "neverthrow";
import { ScheduleOverlapError } from "./schedule.errors.js";

/**
 * @typedef {object} TimeRange
 * @property {string} start "HH:mm"
 * @property {string} end "HH:mm"
 */

/**
 * @typedef {object} DayConfig
 * @property {string} day "MONDAY", "TUESDAY", etc.
 * @property {TimeRange[]} ranges [{ start: "08:00", end: "12:00" }]
 */

/**
 * @typedef {object} NewScheduleConfig
 * @property {object} validity { from: "2023-01-01", to: "2023-12-31" }
 * @property {Date|string} validity.from "2023-01-01"
 * @property {Date|string} validity.to "2023-12-31"
 * @property {DayConfig[]} weeklyDays
 * [{ day: "MONDAY", ranges: [{ start: "08:00", end: "12:00" }] }]
 */

export class OverlapValidator {
  /**
   * Verifies if the new schedule configuration overlaps with existing schedules.
   * @param {NewScheduleConfig} newConfig
   * @param {import('./schedule.model.js').Schedule[]} existingSchedules
   * @returns {import("neverthrow").Result<void, ScheduleOverlapError>}
   * - `void` if no overlaps found
   * - `ScheduleOverlapError` if an overlap is detected
   */
  static validate(newConfig, existingSchedules) {
    if (!existingSchedules.length) {
      return ok();
    }

    // Iteramos por cada día propuesto (Ej: Lunes)
    for (const newDay of newConfig.weeklyDays) {
      // Buscamos en las agendas existentes configuraciones para ESTE día
      for (const existingSchedule of existingSchedules) {
        // Filtramos las configs del schedule existente que sean del mismo día
        const matchingDays = existingSchedule.configs.filter(
          (c) => c.dayOfWeek === newDay.day
        );

        // Comparamos rango por rango
        for (const existingConfig of matchingDays) {
          for (const newRange of newDay.ranges) {
            if (this._isTimeOverlapping(newRange, existingConfig)) {
              return err(
                new ScheduleOverlapError(newDay.day, newRange, existingConfig)
              );
            }
          }
        }
      }
    }

    return ok();
  }

  /**
   * Compares two time ranges in format "HH:mm".
   * Returns true if the new range overlaps with the existing config.
   * @param {TimeRange} newRange
   * @param {import('./schedule.model.js').ScheduleConfig} existingConfig
   * @private
   * @returns {boolean} If it's overlapping or not
   */
  static _isTimeOverlapping(newRange, existingConfig) {
    // Convertir "09:00" a minutos o comparar strings directamente (funciona ISO 8601)
    // "09:00" < "10:00" es true en JS.

    // Rango A: New
    const startNew = newRange.start;
    const endNew = newRange.end;

    // Rango B: Existing
    const startExisting = existingConfig.startTime;
    const endExisting = existingConfig.endTime;

    // Fórmula de intersección: StartA < EndB && EndA > StartB
    return startNew < endExisting && endNew > startExisting;
  }
}
