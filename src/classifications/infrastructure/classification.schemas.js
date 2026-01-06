import { z } from "zod";

/**
 * Schema for creating a classification.
 */
export const createClassificationSchema = z.object({
  name: z
    .string({ error: "El nombre es requerido" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .toLowerCase(),
});

/**
 * Schema for updating a classification.
 */
export const updateClassificationSchema = z.object({
  name: z
    .string({ error: "El nombre es requerido" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .toLowerCase(),
});

/**
 * Successfully validated create classification data type.
 * @typedef {z.infer<typeof createClassificationSchema>} CreateClassificationDTO
 */

/**
 * Successfully validated update classification data type.
 * @typedef {z.infer<typeof updateClassificationSchema>} UpdateClassificationDTO
 */

/**
 * Validates the create classification data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: CreateClassificationDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateCreateClassification(body) {
  return createClassificationSchema.safeParseAsync(body);
}

/**
 * Validates the update classification data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: UpdateClassificationDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateUpdateClassification(body) {
  return updateClassificationSchema.safeParseAsync(body);
}
