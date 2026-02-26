import { z } from "zod";
import { commonUserFields } from "../../users/infrastructure/user.schemas.js";

/**
 * Schema for a single credential (specialty + license).
 */
const credentialSchema = z.object({
  specialtyId: z.coerce
    .number({ error: "La especialidad es requerida" })
    .int()
    .positive("Seleccione una especialidad válida"),
  licenseNumber: z
    .string({ error: "El número de matrícula es requerido" })
    .trim()
    .min(1, "El número de matrícula es requerido")
    .max(50, "El número de matrícula no puede tener más de 50 caracteres"),
});

/**
 * Schema for creating a professional.
 * Extends common user fields with optional credentials array.
 */
export const createProfessionalSchema = commonUserFields.extend({
  credentials: z.array(credentialSchema).optional().default([]),
});

/**
 * Successfully validated create professional data type.
 * @typedef {z.infer<typeof createProfessionalSchema>} CreateProfessionalDTO
 */

/**
 * Validates the create professional data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: CreateProfessionalDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateCreateProfessional(body) {
  return createProfessionalSchema.safeParseAsync(body);
}

/**
 * Schema for adding a specialty to an existing professional.
 */
export const addSpecialtySchema = z.object({
  specialtyId: z.coerce
    .number({ error: "La especialidad es requerida" })
    .int()
    .positive("Seleccione una especialidad válida"),
  licenseNumber: z
    .string({ error: "El número de matrícula es requerido" })
    .trim()
    .min(1, "El número de matrícula es requerido")
    .max(50, "El número de matrícula no puede tener más de 50 caracteres"),
});

/**
 * Successfully validated add specialty data type.
 * @typedef {z.infer<typeof addSpecialtySchema>} AddSpecialtyDTO
 */

/**
 * Validates the add specialty data.
 * @param {unknown} body Data to validate.
 * @returns {Promise<{
 *   success: true;
 *   data: AddSpecialtyDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>}
 */
export async function validateAddSpecialty(body) {
  return addSpecialtySchema.safeParseAsync(body);
}
