/**
 * Keeps the schedule grid consistent across a reload.
 *
 * A slot cell is rendered by the server (`macros/slot-cell.njk`): the status
 * badge, its Spanish label and the patient name all come from that single
 * template. Patching the cell from JavaScript duplicated the template and
 * still left the cell reading "Libre" after a booking, so the client asks the
 * server for a fresh document instead — and restores what the reload would
 * otherwise discard: the grid scroll position and the slot the user was
 * looking at.
 */

/** Session key holding the grid scroll offset across the reload. */
const SCHEDULE_GRID_SCROLL_KEY = "schedule-grid-scroll";

/** Session key holding the slot whose modal must reopen after the reload. */
const SCHEDULE_GRID_SLOT_KEY = "schedule-grid-open-slot";

/**
 * Saves the grid scroll offset and the slot to reopen, then reloads the page.
 * @param {number} [slotId] - Slot whose modal should reopen after the reload.
 * @returns {void}
 */
function reloadScheduleGrid(slotId) {
  const container = document.querySelector(".time-grid-container");

  if (container) {
    sessionStorage.setItem(
      SCHEDULE_GRID_SCROLL_KEY,
      String(container.scrollTop)
    );
  }

  if (slotId) {
    sessionStorage.setItem(SCHEDULE_GRID_SLOT_KEY, String(slotId));
  }

  window.location.reload();
}

/**
 * Restores the scroll offset saved by `reloadScheduleGrid`, once.
 * @returns {void}
 */
(function restoreScheduleGridScroll() {
  const container = document.querySelector(".time-grid-container");

  if (!container) {
    return;
  }

  const saved = sessionStorage.getItem(SCHEDULE_GRID_SCROLL_KEY);

  if (saved === null) {
    return;
  }

  sessionStorage.removeItem(SCHEDULE_GRID_SCROLL_KEY);
  container.scrollTop = Number.parseInt(saved, 10) || 0;
})();

/**
 * Reopens the slot modal the user was looking at before the reload, reusing
 * the click handler the page already attached to each cell.
 * @returns {void}
 */
function openPendingScheduleSlot() {
  const pending = sessionStorage.getItem(SCHEDULE_GRID_SLOT_KEY);

  if (pending === null) {
    return;
  }

  sessionStorage.removeItem(SCHEDULE_GRID_SLOT_KEY);

  const trigger = document.querySelector(
    `.slot-trigger[data-slot-id="${pending}"]`
  );

  if (trigger) {
    trigger.click();
  }
}

// After DOMContentLoaded so the page's own cell handlers are already attached.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(openPendingScheduleSlot, 0);
});
