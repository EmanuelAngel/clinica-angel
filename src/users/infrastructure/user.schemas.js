import { z } from "zod";
import { Roles } from "../../auth/domain/roles.js";

/**
 * Allowed roles for staff users.
 */
const StaffRole = z.enum([Roles.ADMIN, Roles.SECRETARY]);

/**
 * @typedef {z.infer<typeof StaffRole>} StaffRoleType
 */

/**
 * Successfully validated base user registration data type.
 * @typedef {z.infer<typeof baseUserRegistrationSchema>} BaseUserRegistrationDTO
 */

const nameValidationRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/;

export const commonUserFields = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.email({ message: "El email es inválido o requerido" })
  ),

  password: z
    .string({ error: "La contraseña es requerida" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100),

  firstNames: z
    .string({ error: "Los nombres son requeridos" })
    .trim()
    .min(2)
    .max(100)
    .regex(
      nameValidationRegex,
      "El nombre contiene caracteres inválidos (números o símbolos)"
    ),

  lastNames: z
    .string({ error: "Los apellidos son requeridos" })
    .trim()
    .min(2)
    .max(100)
    .regex(nameValidationRegex, "El apellido contiene caracteres inválidos"),

  phone: z
    .string({ error: "El teléfono es requerido" })
    .trim()
    .min(8)
    .max(20)
    .refine((val) => /\d/.test(val), "El teléfono debe contener números")
    .refine(
      (val) => /^[0-9+\-() ]+$/.test(val),
      "El teléfono contiene caracteres no válidos"
    ),

  address: z
    .string({ error: "La dirección es requerida" })
    .trim()
    .min(5, "La dirección debe ser más descriptiva")
    .max(180),

  nationalId: z
    .string({ error: "El DNI es requerido" })
    .trim()
    .regex(/^\d{7,9}$/, "El DNI debe ser numérico y tener entre 7 y 9 dígitos"),
});

export const baseUserRegistrationSchema = commonUserFields.extend({
  role: StaffRole,
});

/**
 * Validates the base user registration data.
 * @param {unknown} body Registration data.
 * @returns {Promise<{
 *   success: true;
 *   data: BaseUserRegistrationDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>} Resultado de la validación segura.
 */
export async function validateBaseUserRegistration(body) {
  return baseUserRegistrationSchema.safeParseAsync(body);
}
