import { ok, err } from "neverthrow";
import {
  SlotDurationCannotBeZeroError,
  SlotStartDateCannotBeAfterEndDateError,
} from "./schedule.errors.js";

export class SlotsGeneratorService {
  /**
   * Genera una lista plana de objetos Slot basándose en la configuración.
   * No tiene efectos secundarios (no toca la DB).
   * @param {object} params
   * @param {Date | string} params.startDate - Inicio de la vigencia de la agenda
   * @param {Date | string} params.endDate - Fin de la vigencia
   * @param {Array<{day: string, ranges: Array<{start: string, end: string}>}>} params.daysAndTimes - Configuración semanal (MONDAY, etc.)
   * @param {number} params.slotDurationMinutes - Duración de cada turno (ej: 20)
   * @param {Array<{start: Date, end: Date}>} [params.blocks] - (Opcional) Días a omitir
   * @returns {import("neverthrow").Result<
   *   Array<{startsAt: Date}>,
   *   SlotStartDateCannotBeAfterEndDateError |
   *   SlotDurationCannotBeZeroError
   * >}
   * - `Array<{startsAt: Date}>` Una lista de los comienzos de cada slot.
   * - `SlotStartDateCannotBeAfterEndDateError`: La fecha de inicio del turno
   *   no puede ser posterior a la fecha de fin.
   * - `SlotDurationCannotBeZeroError`: La duración del turno debe ser mayor a
   *   0 minutos.
   */
  static generate({
    startDate,
    endDate,
    daysAndTimes,
    slotDurationMinutes,
    blocks = [],
  }) {
    // 1. Normalización de fechas (para asegurar comparaciones correctas)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validaciones básicas de integridad
    if (start > end) {
      return err(new SlotStartDateCannotBeAfterEndDateError());
    }

    if (slotDurationMinutes <= 0) {
      return err(new SlotDurationCannotBeZeroError());
    }

    const slots = [];
    const currentCursor = new Date(start);
    // Seteamos el cursor a las 00:00:00 para iterar días completos
    currentCursor.setHours(0, 0, 0, 0);

    // Mapeo para traducir getDay() (0-6) a tu Enum de strings
    const dayMap = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    // 2. BUCLE PRINCIPAL: Iterar día por día
    while (currentCursor <= end) {
      const dayName = dayMap[currentCursor.getDay()];

      // --- AC8: Precedencia de Bloqueos ---
      // Verificamos si el día actual cae dentro de algún rango de bloqueo.
      // Comparamos timestamps para ser precisos.
      const isBlocked = blocks.some((block) => {
        const blockStart = new Date(block.start).setHours(0, 0, 0, 0);

        const blockEnd = new Date(block.end).setHours(23, 59, 59, 999);

        const current = currentCursor.getTime();

        return current >= blockStart && current <= blockEnd;
      });

      // Si NO está bloqueado y TENEMOS configuración para ese día...
      const dayConfig = daysAndTimes.find((d) => d.day === dayName);

      if (!isBlocked && dayConfig) {
        // Iteramos por cada rango horario del día (ej: Mañana y Tarde)
        for (const range of dayConfig.ranges) {
          const newSlots = this._calculateSlotsForRange(
            currentCursor,
            range.start,
            range.end,
            slotDurationMinutes
          );

          slots.push(...newSlots);
        }
      }

      // Avanzamos al siguiente día
      currentCursor.setDate(currentCursor.getDate() + 1);
    }

    return ok(slots);
  }

  /**
   * Método privado (helper) para dividir un rango de tiempo en slots.
   * Aplica la lógica de AC6 (descartar sobrantes).
   * @param {Date} dateBase - El día sobre el que estamos trabajando
   * @param {string} startTimeStr - Ej: "09:00"
   * @param {string} endTimeStr - Ej: "12:10"
   * @param {number} durationMinutes - Ej: 30
   * @returns {Array<{startsAt: Date}>} Una lista de los comienzos de cada slot.
   */
  static _calculateSlotsForRange(
    dateBase,
    startTimeStr,
    endTimeStr,
    durationMinutes
  ) {
    const generatedSlots = [];

    // Parseamos las horas strings a números
    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);

    // Creamos objetos Date específicos para el inicio y fin del Rango
    const rangeStart = new Date(dateBase);
    rangeStart.setHours(startH, startM, 0, 0);

    const rangeEnd = new Date(dateBase);
    rangeEnd.setHours(endH, endM, 0, 0);

    // Cursor temporal para recorrer el rango
    let slotCursor = new Date(rangeStart);

    // 3. BUCLE INTERNO: Generar slots dentro del rango
    while (slotCursor < rangeEnd) {
      // Calculamos cuándo terminaría este slot potencial
      const potentialEnd = new Date(
        slotCursor.getTime() + durationMinutes * 60000
      );

      // --- AC6: Regla de Ajuste ---
      // Si el slot termina DESPUÉS del fin del rango, se descarta y paramos.
      // Ej: Rango termina 10:00. Slot 09:40 + 30min = 10:10. 10:10 > 10:00 -> Break.
      if (potentialEnd > rangeEnd) {
        break;
      }

      // Agregamos el slot válido
      generatedSlots.push({
        startsAt: new Date(slotCursor), // Importante: Clonar la fecha
      });

      // Avanzamos el cursor para el siguiente slot
      slotCursor = potentialEnd;
    }

    return generatedSlots;
  }
}
