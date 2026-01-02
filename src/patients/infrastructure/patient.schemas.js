import { z } from "zod";
import { commonUserFields } from "../../users/infrastructure/user.schemas.js";

/**
 * Successfully validated patient registration data type.
 * @typedef {z.infer<typeof patientRegistrationSchema>} PatientRegistrationDTO
 */

export const patientRegistrationSchema = commonUserFields
  .extend({
    nationalIdImage: z
      .any()
      .refine(
        (file) => file?.fieldname === "nationalIdImage",
        "La imagen es requerida"
      )
      .refine(
        (file) => file?.size <= 2 * 1024 * 1024,
        "El archivo no debe pesar más de 2MB"
      )
      .refine(
        (file) =>
          ["image/png", "image/jpeg", "image/jpg"].includes(file?.mimetype),
        "Solo se aceptan formatos PNG, JPG o JPEG"
      ),

    healthInsurances: z
      .array(
        z.object({
          insuranceId: z.coerce
            .number({ error: "Por favor, elija una obra social." })
            .int("El ID del seguro debe ser un número entero")
            .positive("El ID del seguro debe ser positivo"),
          memberNumber: z
            .string({
              error:
                "El número de afiliado es obligatorio si selecciona una obra social",
            })
            .trim()
            .min(1, "El número de afiliado no puede estar vacío")
            .max(50, "El número de afiliado no puede exceder 50 caracteres"),
        })
      )
      .optional()
      .default([]),
  })
  .transform((data) => {
    return {
      ...data,
      nationalIdImageUrl: `/uploads/${data.nationalIdImage.filename}`,
    };
  });

/**
 * Validates the patient registration data.
 * @param {unknown} body Registration data.
 * @returns {Promise<{
 *   success: true;
 *   data: PatientRegistrationDTO;
 * } | {
 *   success: false;
 *   error: import('zod').ZodError;
 * }>} Resultado de la validación segura.
 */
export async function validatePatientRegistration(body) {
  return patientRegistrationSchema.safeParseAsync(body);
}
