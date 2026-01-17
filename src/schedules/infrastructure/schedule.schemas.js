import { z } from "zod";

// TODO: Translate comments to english.
// REFACTOR: Create a shared ENUM for days instead of using magic strings everywhere.

// --- Constantes y Helpers ---

// Regex para formato HH:mm estricto
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Días permitidos
const DAYS_ENUM = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/**
 * Helper to ensure a date string "YYYY-MM-DD" is treated as local midnight.
 * @param {unknown} val - The value to parse.
 * @returns {Date} The parsed local date.
 */
function parseLocalDate(val) {
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  if (typeof val !== "string") return new Date(String(val));

  // If it matches YYYY-MM-DD, parse as local
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [year, month, day] = val.split("-").map(Number);
    // Month is 0-indexed in JS Date constructor
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(val);
}

/**
 * @param {string} start
 * @param {string} end
 * @returns {boolean} True if start is before end.
 */
function isTimeBefore(start, end) {
  return start < end;
}

// Helper para comparar horas strings ("09:00" < "10:00")

// --- Sub-esquemas ---

const timeRangeSchema = z
  .object({
    start: z.string().regex(TIME_REGEX, "Formato inválido (HH:mm)"),
    end: z.string().regex(TIME_REGEX, "Formato inválido (HH:mm)"),
  })
  .refine((data) => isTimeBefore(data.start, data.end), {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end"], // El error aparecerá en el campo 'end'
  });

const dayConfigSchema = z.object({
  day: z.enum(DAYS_ENUM, {
    error: "Día inválido. Use MONDAY, TUESDAY, etc.",
  }),
  ranges: z
    .array(timeRangeSchema)
    .min(1, "Debe definir al menos un rango horario"),
});

const blockSchema = z
  .object({
    start: z.preprocess(
      parseLocalDate,
      z.date({
        error: "Fecha de inicio inválida",
      })
    ),
    end: z.preprocess(
      parseLocalDate,
      z.date({
        error: "Fecha de fin inválida",
      })
    ),
    motive: z.string().min(3, "El motivo es requerido (mínimo 3 caracteres)"),
  })
  .refine((data) => data.end >= data.start, {
    message: "La fecha de fin del bloqueo no puede ser anterior al inicio",
    path: ["end"],
  });

// --- Esquema Principal ---

/**
 * Successfully validated create schedule data type.
 * @typedef {z.infer<typeof createScheduleSchema>} CreateScheduleDTO
 */
export const createScheduleSchema = z.object({
  schedule: z.object({
    licenseNumber: z.string().min(1, "La matrícula es requerida"),
    locationId: z.coerce.number().int().positive("La sucursal es requerida"),
    classificationId: z.coerce
      .number()
      .int()
      .positive("La clasificación es requerida"),

    // AC: Entre 10 a 60 minutos, paso de 5
    slotDurationMinutes: z.coerce
      .number()
      .min(10, "Mínimo 10 minutos")
      .max(60, "Máximo 60 minutos")
      .refine(
        (val) => val % 5 === 0,
        "La duración debe ser múltiplo de 5 (10, 15, 20...)"
      ),

    // AC: Sobreturnos
    maxOverbooksPerDay: z.coerce
      .number()
      .min(0)
      .max(20, "Máximo 20 sobreturnos por día"),
    maxOverbooksPerSlot: z.coerce
      .number()
      .min(0)
      .max(2, "Máximo 2 sobreturnos por horario"),
  }),

  config: z.object({
    validity: z
      .object({
        from: z.preprocess(
          parseLocalDate,
          z.date({ error: "Fecha desde es requerida" })
        ),
        to: z.preprocess(
          parseLocalDate,
          z.date({ error: "Fecha hasta es requerida" })
        ),
      })
      .refine((data) => data.to > data.from, {
        message: "La fecha 'hasta' debe ser mayor a 'desde'",
        path: ["to"],
      })
      .refine(
        (data) => {
          // AC: Máximo 3 meses de vigencia
          const threeMonthsLater = new Date(data.from);
          threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
          // Agregamos holgura de un día por temas de zonas horarias
          threeMonthsLater.setDate(threeMonthsLater.getDate() + 1);
          return data.to <= threeMonthsLater;
        },
        {
          message: "La vigencia de la agenda no puede superar los 3 meses",
          path: ["to"],
        }
      ),

    weeklyDays: z
      .array(dayConfigSchema)
      .min(1, "Debe configurar al menos un día de atención"),
  }),

  blocks: z.array(blockSchema).optional().default([]),
});

/**
 * Validates the create schedule data.
 * @param {unknown} body Request body.
 * @returns {Promise<{
 * success: true;
 * data: CreateScheduleDTO;
 * } | {
 * success: false;
 * error: import('zod').ZodError;
 * }>} Safe parse result.
 */
export async function validateCreateSchedule(body) {
  return createScheduleSchema.safeParseAsync(body);
}
