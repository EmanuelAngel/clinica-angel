/**
 * Map of vista values to the number of days they span.
 * Also used for calculating navigation jumps.
 * @type {Record<string, number>}
 */
export const VISTA_STEPS = {
  hoy: 1,
  "3-dias": 3,
  semana: 7,
};

/**
 * Valid vista values.
 * @type {string[]}
 */
export const VALID_VISTAS = Object.keys(VISTA_STEPS);

/**
 * @typedef {object} DateRange
 * @property {Date} startDate - Start of the range (midnight of the base date).
 * @property {Date} endDate - End of the range (23:59:59.999 of the last day).
 * @property {Date[]} dates - Array of individual day dates (midnight each) for column generation.
 */

/**
 * Calculates the date range for a given vista and base date.
 * @param {string} vista - The view mode: 'hoy', '3-dias', or 'semana'.
 * @param {Date} fecha - The base date (starting point for the range).
 * @returns {DateRange} The computed range with boundaries and individual dates.
 */
export function calculateDateRange(vista, fecha) {
  const days = VISTA_STEPS[vista] || 1;

  // Normalize base date to midnight local time
  const baseDate = new Date(fecha);
  baseDate.setHours(0, 0, 0, 0);

  const startDate = new Date(baseDate);

  // Build array of individual day dates
  const dates = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() + i);
    dates.push(day);
  }

  // End date = last day at 23:59:59.999
  const endDate = new Date(dates[dates.length - 1]);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate, dates };
}
