import { calculateDateRange, VISTA_STEPS } from "./date-range.utils.js";

describe("calculateDateRange", () => {
  test("vista=hoy returns a 1-day range", () => {
    const fecha = new Date(2026, 1, 26); // Feb 26, 2026
    const { startDate, endDate, dates } = calculateDateRange("hoy", fecha);

    expect(dates).toHaveLength(1);
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(1);
    expect(startDate.getDate()).toBe(26);
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);

    expect(endDate.getDate()).toBe(26);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
  });

  test("vista=3-dias returns 3 consecutive days", () => {
    const fecha = new Date(2026, 1, 26);
    const { startDate, endDate, dates } = calculateDateRange("3-dias", fecha);

    expect(dates).toHaveLength(3);
    expect(dates[0].getDate()).toBe(26);
    expect(dates[1].getDate()).toBe(27);
    expect(dates[2].getDate()).toBe(28);

    expect(startDate.getDate()).toBe(26);
    expect(endDate.getDate()).toBe(28);
    expect(endDate.getHours()).toBe(23);
  });

  test("vista=semana returns 7 consecutive days", () => {
    const fecha = new Date(2026, 0, 12); // Jan 12 (no month-crossing)
    const { dates } = calculateDateRange("semana", fecha);

    expect(dates).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      const expected = new Date(2026, 0, 12 + i);
      expect(dates[i].getDate()).toBe(expected.getDate());
      expect(dates[i].getMonth()).toBe(expected.getMonth());
    }
  });

  test("handles month boundary crossing (Feb → Mar)", () => {
    // 2026 is NOT a leap year, so Feb has 28 days
    const fecha = new Date(2026, 1, 27); // Feb 27
    const { dates } = calculateDateRange("3-dias", fecha);

    expect(dates).toHaveLength(3);
    expect(dates[0].getMonth()).toBe(1); // Feb
    expect(dates[0].getDate()).toBe(27);
    expect(dates[1].getMonth()).toBe(1); // Feb
    expect(dates[1].getDate()).toBe(28);
    expect(dates[2].getMonth()).toBe(2); // Mar
    expect(dates[2].getDate()).toBe(1);
  });

  test("handles month boundary crossing with semana", () => {
    const fecha = new Date(2026, 1, 25); // Feb 25
    const { dates, endDate } = calculateDateRange("semana", fecha);

    expect(dates).toHaveLength(7);
    // Feb 25,26,27,28, Mar 1,2,3
    expect(dates[3].getMonth()).toBe(1); // Feb 28
    expect(dates[3].getDate()).toBe(28);
    expect(dates[4].getMonth()).toBe(2); // Mar 1
    expect(dates[4].getDate()).toBe(1);
    expect(dates[6].getMonth()).toBe(2); // Mar 3
    expect(dates[6].getDate()).toBe(3);

    expect(endDate.getMonth()).toBe(2);
    expect(endDate.getDate()).toBe(3);
    expect(endDate.getHours()).toBe(23);
  });

  test("navigation non-overlap: two consecutive semana ranges do not overlap", () => {
    const step = VISTA_STEPS["semana"]; // 7
    const fecha1 = new Date(2026, 1, 23);
    const fecha2 = new Date(2026, 1, 23);
    fecha2.setDate(fecha2.getDate() + step);

    const range1 = calculateDateRange("semana", fecha1);
    const range2 = calculateDateRange("semana", fecha2);

    // range1 endDate < range2 startDate
    expect(range1.endDate.getTime()).toBeLessThan(range2.startDate.getTime());

    // No date overlap between the two ranges
    const range1Dates = range1.dates.map((d) => d.toDateString());
    const range2Dates = range2.dates.map((d) => d.toDateString());
    const overlap = range1Dates.filter((d) => range2Dates.includes(d));
    expect(overlap).toHaveLength(0);
  });

  test("navigation non-overlap: two consecutive 3-dias ranges do not overlap", () => {
    const step = VISTA_STEPS["3-dias"]; // 3
    const fecha1 = new Date(2026, 1, 26);
    const fecha2 = new Date(2026, 1, 26);
    fecha2.setDate(fecha2.getDate() + step);

    const range1 = calculateDateRange("3-dias", fecha1);
    const range2 = calculateDateRange("3-dias", fecha2);

    expect(range1.endDate.getTime()).toBeLessThan(range2.startDate.getTime());
  });

  test("defaults to 1 day for unknown vista value", () => {
    const fecha = new Date(2026, 1, 26);
    const { dates } = calculateDateRange("invalid", fecha);

    expect(dates).toHaveLength(1);
  });

  test("normalizes input date time to midnight", () => {
    const fecha = new Date(2026, 1, 26, 15, 30, 45); // 3:30 PM
    const { startDate, dates } = calculateDateRange("hoy", fecha);

    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(dates[0].getHours()).toBe(0);
  });
});
