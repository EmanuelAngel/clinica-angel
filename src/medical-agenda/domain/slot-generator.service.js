import { ok, err } from "neverthrow";
import {
  InvalidTimeRangeError,
  InvalidValidityPeriodError,
} from "./schedule.errors.js";

/**
 * @typedef {import("./schedule.repository.js").CreateConfigData} CreateConfigData
 * @typedef {import("./schedule.repository.js").CreateBlockData} CreateBlockData
 * @typedef {import("./schedule.repository.js").CreateSlotData} CreateSlotData
 * @typedef {import("../../../generated/prisma/index.js").DayOfWeek} DayOfWeek
 */

/**
 * Maps JavaScript getDay() (0=Sunday) to our DayOfWeek enum.
 * @type {Record<number, DayOfWeek>}
 */
const JS_DAY_TO_ENUM = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

/**
 * Maximum validity period in months.
 */
const MAX_VALIDITY_MONTHS = 3;

/**
 * Pure domain service for generating time slots.
 * Does NOT access the database.
 */
export class SlotGeneratorService {
  /**
   * Validates that a time range is valid (end > start).
   * @param {string} startTime - Start time in HH:mm format.
   * @param {string} endTime - End time in HH:mm format.
   * @returns {import("neverthrow").Result<void, InvalidTimeRangeError>}
   */
  validateTimeRange(startTime, endTime) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return err(new InvalidTimeRangeError());
    }

    return ok(undefined);
  }

  /**
   * Validates the validity period.
   * @param {Date} validFrom - Start date.
   * @param {Date} validUntil - End date.
   * @returns {import("neverthrow").Result<void, InvalidValidityPeriodError>}
   */
  validateValidityPeriod(validFrom, validUntil) {
    if (validUntil <= validFrom) {
      return err(
        new InvalidValidityPeriodError(
          "La fecha de fin debe ser posterior a la fecha de inicio."
        )
      );
    }

    // Check max 3 months
    const diffMs = validUntil.getTime() - validFrom.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const approxMonths = diffDays / 30;

    if (approxMonths > MAX_VALIDITY_MONTHS) {
      return err(
        new InvalidValidityPeriodError(
          `El período no puede exceder ${MAX_VALIDITY_MONTHS} meses.`
        )
      );
    }

    return ok(undefined);
  }

  /**
   * Checks if a date falls within any of the given blocks.
   * @param {Date} date - The date to check.
   * @param {CreateBlockData[]} blocks - Array of block periods.
   * @returns {boolean} True if the date is blocked.
   */
  isDateBlocked(date, blocks) {
    const dateOnly = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );

    return blocks.some((block) => {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      return dateOnly >= blockStart && dateOnly <= blockEnd;
    });
  }

  /**
   * Generates slots for the given configuration.
   * @param {Array<{ dayOfWeek: DayOfWeek, startTime: string, endTime: string }>} weeklyDays - Weekly schedule config.
   * @param {Date} validFrom - Start of validity period.
   * @param {Date} validUntil - End of validity period.
   * @param {number} slotDurationMinutes - Duration of each slot in minutes.
   * @param {CreateBlockData[]} blocks - Periods to exclude from slot generation.
   * @returns {CreateSlotData[]} Array of slots to create.
   */
  generateSlots(
    weeklyDays,
    validFrom,
    validUntil,
    slotDurationMinutes,
    blocks
  ) {
    /** @type {CreateSlotData[]} */
    const slots = [];

    // Build a map of day -> time ranges for quick lookup
    /** @type {Map<DayOfWeek, Array<{ startTime: string, endTime: string }>>} */
    const dayRangesMap = new Map();

    for (const dayConfig of weeklyDays) {
      const existing = dayRangesMap.get(dayConfig.dayOfWeek) || [];
      existing.push({
        startTime: dayConfig.startTime,
        endTime: dayConfig.endTime,
      });
      dayRangesMap.set(dayConfig.dayOfWeek, existing);
    }

    // Iterate through each day in the validity range
    const currentDate = new Date(validFrom);
    const endDate = new Date(validUntil);

    while (currentDate <= endDate) {
      // Check if date is blocked
      if (this.isDateBlocked(currentDate, blocks)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Get day of week
      const jsDayOfWeek = currentDate.getDay();
      const dayOfWeek = JS_DAY_TO_ENUM[jsDayOfWeek];

      // Check if we have configs for this day
      const ranges = dayRangesMap.get(dayOfWeek);

      if (ranges) {
        for (const range of ranges) {
          const slotsForRange = this.generateSlotsForRange(
            currentDate,
            range.startTime,
            range.endTime,
            slotDurationMinutes
          );
          slots.push(...slotsForRange);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generates slots for a specific date and time range.
   * @param {Date} date - The date.
   * @param {string} startTime - Start time in HH:mm format.
   * @param {string} endTime - End time in HH:mm format.
   * @param {number} slotDurationMinutes - Duration of each slot.
   * @returns {CreateSlotData[]} Array of slots for this range.
   */
  generateSlotsForRange(date, startTime, endTime, slotDurationMinutes) {
    /** @type {CreateSlotData[]} */
    const slots = [];

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + slotDurationMinutes <= endMinutes) {
      const slotHour = Math.floor(currentMinutes / 60);
      const slotMinute = currentMinutes % 60;

      // Create slot datetime in UTC
      const slotDateTime = new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          slotHour,
          slotMinute,
          0,
          0
        )
      );

      slots.push({ startsAt: slotDateTime });
      currentMinutes += slotDurationMinutes;
    }

    return slots;
  }

  /**
   * Checks if two time ranges overlap.
   * @param {string} newStart - New range start time (HH:mm).
   * @param {string} newEnd - New range end time (HH:mm).
   * @param {Date} existingStart - Existing range start time.
   * @param {Date} existingEnd - Existing range end time.
   * @returns {boolean} True if ranges overlap.
   */
  doTimeRangesOverlap(newStart, newEnd, existingStart, existingEnd) {
    const [newStartH, newStartM] = newStart.split(":").map(Number);
    const [newEndH, newEndM] = newEnd.split(":").map(Number);

    const newStartMinutes = newStartH * 60 + newStartM;
    const newEndMinutes = newEndH * 60 + newEndM;

    // Extract hours and minutes from Date objects (stored as TIME in DB)
    const existingStartMinutes =
      existingStart.getUTCHours() * 60 + existingStart.getUTCMinutes();
    const existingEndMinutes =
      existingEnd.getUTCHours() * 60 + existingEnd.getUTCMinutes();

    // Overlap condition: newStart < existingEnd AND newEnd > existingStart
    return (
      newStartMinutes < existingEndMinutes &&
      newEndMinutes > existingStartMinutes
    );
  }

  /**
   * Checks if two date ranges overlap.
   * @param {Date} newFrom - New range start date.
   * @param {Date} newUntil - New range end date.
   * @param {Date} existingFrom - Existing range start date.
   * @param {Date} existingUntil - Existing range end date.
   * @returns {boolean} True if date ranges overlap.
   */
  doDateRangesOverlap(newFrom, newUntil, existingFrom, existingUntil) {
    return newFrom <= existingUntil && newUntil >= existingFrom;
  }
}
