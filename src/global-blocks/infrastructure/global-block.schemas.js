import { z } from "zod";

/**
 * Helper to ensure a date string "YYYY-MM-DD" is treated as local midnight.
 * Replicates the pattern from schedule.schemas.js.
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
 * Schema for creating a global block.
 */
export const createGlobalBlockSchema = z
  .object({
    startDate: z.preprocess(
      parseLocalDate,
      z.date({ error: "Fecha de inicio inválida" })
    ),
    endDate: z.preprocess(
      parseLocalDate,
      z.date({ error: "Fecha de fin inválida" })
    ),
    reason: z
      .string({ error: "El motivo es requerido" })
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres")
      .max(500, "El motivo no puede tener más de 500 caracteres"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });

/**
 * Schema for updating a global block.
 */
export const updateGlobalBlockSchema = z
  .object({
    startDate: z.preprocess(
      parseLocalDate,
      z.date({ error: "Fecha de inicio inválida" })
    ),
    endDate: z.preprocess(
      parseLocalDate,
      z.date({ error: "Fecha de fin inválida" })
    ),
    reason: z
      .string({ error: "El motivo es requerido" })
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres")
      .max(500, "El motivo no puede tener más de 500 caracteres"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });

/**
 * Successfully validated create global block data type.
 * @typedef {z.infer<typeof createGlobalBlockSchema>} CreateGlobalBlockDTO
 */

/**
 * Successfully validated update global block data type.
 * @typedef {z.infer<typeof updateGlobalBlockSchema>} UpdateGlobalBlockDTO
 */

/**
 * Validates the create global block data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: CreateGlobalBlockDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateCreateGlobalBlock(body) {
  return createGlobalBlockSchema.safeParseAsync(body);
}

/**
 * Validates the update global block data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: UpdateGlobalBlockDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateUpdateGlobalBlock(body) {
  return updateGlobalBlockSchema.safeParseAsync(body);
}
