import { z } from "zod";

/**
 * Schema for creating a specialty.
 */
export const createSpecialtySchema = z.object({
  name: z
    .string({ error: "El nombre es requerido" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .toLowerCase(),
});

/**
 * Successfully validated create specialty data type.
 * @typedef {z.infer<typeof createSpecialtySchema>} CreateSpecialtyDTO
 */

/**
 * Validates the create specialty data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: CreateSpecialtyDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateCreateSpecialty(body) {
  return createSpecialtySchema.safeParseAsync(body);
}
