import { z } from "zod";

/**
 * Helper to ensure a date string "YYYY-MM-DD" is treated as local midnight.
 * @param {unknown} val - The value to parse.
 * @returns {Date} The parsed local date.
 */
function parseLocalDate(val) {
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  if (typeof val !== "string") return new Date(String(val));

  // If it matches YYYY-MM-DD, parse as local
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [year, month, day] = val.split("-").map(Number);
    // Month is 0-indexed in JS Date constructor
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(val);
}

/**
 * Get today's date at midnight local time.
 * @returns {Date}
 */
function getTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Preprocessor that converts empty strings to undefined.
 * @param {unknown} val
 * @returns {unknown}
 */
function emptyToUndefined(val) {
  if (val === "" || val === null) return undefined;
  return val;
}

/**
 * Zod schema for schedule comparison filter validation.
 * All filters are optional except date (defaults to today).
 */
export const comparisonFiltersSchema = z.object({
  location_id: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "El ID de ubicación debe ser un número" })
      .int({ message: "El ID de ubicación debe ser un entero" })
      .positive({ message: "El ID de ubicación debe ser positivo" })
      .optional()
  ),

  specialty_id: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "El ID de especialidad debe ser un número" })
      .int({ message: "El ID de especialidad debe ser un entero" })
      .positive({ message: "El ID de especialidad debe ser positivo" })
      .optional()
  ),

  professional_id: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "El ID de profesional debe ser un número" })
      .int({ message: "El ID de profesional debe ser un entero" })
      .positive({ message: "El ID de profesional debe ser positivo" })
      .optional()
  ),

  classification_id: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "El ID de clasificación debe ser un número" })
      .int({ message: "El ID de clasificación debe ser un entero" })
      .positive({ message: "El ID de clasificación debe ser positivo" })
      .optional()
  ),

  date: z.preprocess(
    emptyToUndefined,
    z.preprocess(parseLocalDate, z.date()).default(getTodayLocal)
  ),
});

/**
 * @typedef {z.infer<typeof comparisonFiltersSchema>} ComparisonFilters
 */

/**
 * Validates the schedule comparison filters.
 * @param {unknown} query - Request query params.
 * @returns {Promise<{
 *   success: true;
 *   data: ComparisonFilters;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>} Safe parse result.
 */
export async function validateComparisonFilters(query) {
  return comparisonFiltersSchema.safeParseAsync(query);
}

/**
 * Checks if any meaningful filter is applied (excluding date).
 * @param {ComparisonFilters} filters
 * @returns {boolean}
 */
export function hasActiveFilters(filters) {
  return !!(
    filters.location_id ||
    filters.specialty_id ||
    filters.professional_id ||
    filters.classification_id
  );
}
