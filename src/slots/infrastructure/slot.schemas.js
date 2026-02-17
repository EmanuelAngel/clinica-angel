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
