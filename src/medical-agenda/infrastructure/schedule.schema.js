import { z } from "zod";

/**
 * Valid slot durations in minutes.
 */
const VALID_SLOT_DURATIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

/**
 * Valid days of week.
 */
const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/**
 * Time regex for HH:mm format.
 */
const TIME_REGEX = /^([0-1][0-9]|2[0-2]):[0-5][0-9]$/;

/**
 * Validates time is within allowed range (08:00 - 22:00).
 * @param {string} time
 * @returns {boolean}
 */
function isTimeInRange(time) {
  const [hours] = time.split(":").map(Number);
  return hours >= 8 && hours <= 22;
}

/**
 * Schema for a time range within a day.
 */
const timeRangeSchema = z
  .object({
    start: z
      .string({ error: "La hora de inicio es requerida" })
      .regex(TIME_REGEX, "Formato de hora inválido (HH:mm)")
      .refine(isTimeInRange, "La hora debe estar entre 08:00 y 22:00"),
    end: z
      .string({ error: "La hora de fin es requerida" })
      .regex(TIME_REGEX, "Formato de hora inválido (HH:mm)")
      .refine(isTimeInRange, "La hora debe estar entre 08:00 y 22:00"),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.start.split(":").map(Number);
      const [endH, endM] = data.end.split(":").map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    },
    { message: "La hora de fin debe ser mayor a la hora de inicio" }
  );

/**
 * Schema for a weekly day configuration.
 */
const weeklyDaySchema = z.object({
  day: z.enum(DAYS_OF_WEEK, {
    error: "Día de la semana inválido",
  }),
  ranges: z
    .array(timeRangeSchema, { error: "Los rangos horarios son requeridos" })
    .min(1, "Debe haber al menos un rango horario"),
});

/**
 * Schema for the schedule base data.
 */
const scheduleDataSchema = z.object({
  licenseNumber: z
    .string({ error: "La matrícula es requerida" })
    .trim()
    .min(1, "La matrícula es requerida"),
  locationId: z.coerce
    .number({ error: "La sucursal es requerida" })
    .int()
    .positive("La sucursal es requerida"),
  classificationId: z.coerce
    .number({ error: "La clasificación es requerida" })
    .int()
    .positive("La clasificación es requerida"),
  slotDurationMinutes: z.coerce
    .number({ error: "La duración del turno es requerida" })
    .refine(
      (val) => VALID_SLOT_DURATIONS.includes(val),
      "La duración debe ser: 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 o 60 minutos"
    ),
  maxOverbooksPerDay: z.coerce
    .number({ error: "Los sobreturnos por día son requeridos" })
    .int()
    .min(0, "Mínimo 0 sobreturnos por día")
    .max(20, "Máximo 20 sobreturnos por día"),
  maxOverbooksPerSlot: z.coerce
    .number({ error: "Los sobreturnos por horario son requeridos" })
    .int()
    .min(0, "Mínimo 0 sobreturnos por horario")
    .max(2, "Máximo 2 sobreturnos por horario"),
});

/**
 * Schema for a block period.
 */
const blockSchema = z
  .object({
    start: z
      .string({ error: "La fecha de inicio del bloqueo es requerida" })
      .date("Formato de fecha inválido (YYYY-MM-DD)"),
    end: z
      .string({ error: "La fecha de fin del bloqueo es requerida" })
      .date("Formato de fecha inválido (YYYY-MM-DD)"),
    motive: z
      .string({ error: "El motivo del bloqueo es requerido" })
      .trim()
      .min(1, "El motivo del bloqueo es requerido"),
  })
  .refine((data) => new Date(data.end) >= new Date(data.start), {
    message: "La fecha de fin debe ser mayor o igual a la fecha de inicio",
  });

/**
 * Schema for the config section.
 */
const configSchema = z.object({
  validity: z
    .object({
      from: z
        .string({ error: "La fecha de inicio de vigencia es requerida" })
        .date("Formato de fecha inválido (YYYY-MM-DD)"),
      to: z
        .string({ error: "La fecha de fin de vigencia es requerida" })
        .date("Formato de fecha inválido (YYYY-MM-DD)"),
    })
    .refine((data) => new Date(data.to) > new Date(data.from), {
      message: "La fecha de fin debe ser mayor a la fecha de inicio",
    }),
  weeklyDays: z
    .array(weeklyDaySchema, { error: "Los días de la semana son requeridos" })
    .min(1, "Debe configurar al menos un día de la semana"),
});

/**
 * Complete schema for creating a schedule.
 */
export const createScheduleSchema = z.object({
  schedule: scheduleDataSchema,
  config: configSchema,
  blocks: z.array(blockSchema).default([]),
});

/**
 * @typedef {z.infer<typeof createScheduleSchema>} CreateScheduleSchemaDTO
 */

/**
 * Validates the create schedule input.
 * @param {unknown} body
 * @returns {Promise<import("zod").SafeParseReturnType<unknown, CreateScheduleSchemaDTO>>}
 */
export async function validateCreateSchedule(body) {
  return createScheduleSchema.safeParseAsync(body);
}
