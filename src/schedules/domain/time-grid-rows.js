/**
 * Derives the time-grid rows from the slots that actually exist, instead of a
 * fixed ladder. A hardcoded 10-minute ladder silently drops any slot whose
 * start minute is not a multiple of ten, so a 15-minute agenda renders half of
 * its slots and the rest become unreachable.
 * @param {Array<Array<{startsAt: Date|string}|undefined|null>>} slotLists
 *   One entry per grid column.
 * @returns {Date[]} Unique start times, ascending.
 */
export function buildTimeRows(slotLists) {
  const byKey = new Map();

  for (const list of slotLists) {
    for (const slot of list ?? []) {
      if (!slot || slot.startsAt == null) continue;
      const date = new Date(slot.startsAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      if (!byKey.has(key)) byKey.set(key, date);
    }
  }

  return [...byKey.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => byKey.get(key));
}

/**
 * @param {number} value
 * @returns {string}
 */
function pad(value) {
  return String(value).padStart(2, "0");
}
