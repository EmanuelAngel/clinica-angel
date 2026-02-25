import { z } from "zod";

/**
 * Schema for creating a new waiting list entry.
 */
export const CreateWaitlistSchema = z
  .object({
    dni: z
      .string({ message: "El DNI es obligatorio." })
      .min(1, "El DNI es obligatorio."),
    professionalId: z.coerce.number().int().positive().optional(),
    specialtyId: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => data.professionalId || data.specialtyId, {
    message: "Debe especificar al menos un profesional o una especialidad.",
  });

/**
 * @typedef {z.infer<typeof CreateWaitlistSchema>} CreateWaitlistDTO
 */

/**
 * Schema for listing/filtering waiting list entries.
 */
export const ListWaitlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(["asc", "desc"]).default("asc"),
  professionalId: z.coerce.number().int().positive().optional(),
  specialtyId: z.coerce.number().int().positive().optional(),
});

/**
 * @typedef {z.infer<typeof ListWaitlistQuerySchema>} ListWaitlistQueryDTO
 */
