/**
 * @typedef {z.infer<typeof loginSchema>} LoginDTO
 */

import { commonUserFields } from "../../users/infrastructure/user.schemas.js";

export const loginSchema = commonUserFields.pick({
  email: true,
  password: true,
});

/**
 * Valida los datos de inicio de sesión.
 * @param {unknown} body Datos de login.
 * @returns {Promise<{
 *   success: true;
 *   data: LoginDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>} Resultado de la validación segura.
 */
export async function validateLogin(body) {
  return loginSchema.safeParseAsync(body);
}
