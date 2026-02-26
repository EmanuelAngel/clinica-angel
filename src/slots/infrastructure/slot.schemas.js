import { z } from "zod";

/**
 * Schema for reserving a slot.
 */
export const ReserveSlotSchema = z.object({
  consultationReason: z
    .string({
      error: "El motivo de consulta es obligatorio.",
    })
    .min(5, "El motivo de consulta debe tener al menos 5 caracteres."),
});

/**
 * @typedef {z.infer<typeof ReserveSlotSchema>} ReserveSlotDTO
 */

/**
 * Schema for creating an overbook slot.
 */
export const CreateOverbookSchema = z.object({
  patientId: z.coerce
    .number({ error: "El ID del paciente es obligatorio." })
    .int()
    .positive(),
  consultationReason: z
    .string({
      error: "El motivo de consulta es obligatorio.",
    })
    .min(5, "El motivo de consulta debe tener al menos 5 caracteres."),
});

/**
 * @typedef {z.infer<typeof CreateOverbookSchema>} CreateOverbookDTO
 */
