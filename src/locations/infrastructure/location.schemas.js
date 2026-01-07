import { z } from "zod";

/**
 * Schema for creating a location.
 */
export const createLocationSchema = z.object({
  name: z
    .string({ error: "El nombre es requerido" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres"),
  address: z
    .string({ error: "La dirección es requerida" })
    .trim()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(255, "La dirección no puede tener más de 255 caracteres"),
  phone: z
    .string()
    .trim()
    .max(20, "El teléfono no puede tener más de 20 caracteres")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for updating a location.
 */
export const updateLocationSchema = createLocationSchema.partial();

/**
 * @typedef {z.infer<typeof createLocationSchema>} CreateLocationDTO
 */

/**
 * @typedef {z.infer<typeof updateLocationSchema>} UpdateLocationDTO
 */

/**
 * Validates the create location data.
 * @param {unknown} body
 * @returns {Promise<import("zod").SafeParseReturnType<unknown, CreateLocationDTO>>}
 */
export async function validateCreateLocation(body) {
  return createLocationSchema.safeParseAsync(body);
}

/**
 * Validates the update location data.
 * @param {unknown} body
 * @returns {Promise<import("zod").SafeParseReturnType<unknown, UpdateLocationDTO>>}
 */
export async function validateUpdateLocation(body) {
  return updateLocationSchema.safeParseAsync(body);
}
