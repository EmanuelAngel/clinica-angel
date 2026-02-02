import { SlotStatus } from "../../schedules/domain/slot-status.js";
import { Roles } from "../../auth/domain/roles.js";

/**
 * @typedef {keyof typeof SlotStatus} SlotStatusKey
 * @typedef {keyof typeof SlotActions} SlotActionKey
 */

/**
 * Available slot actions (triggers for state transitions).
 * @enum {string}
 * @readonly
 */
export const SlotActions = Object.freeze({
  RESERVE: "RESERVE",
  CONFIRM: "CONFIRM",
  CANCEL: "CANCEL",
  ARRIVE: "ARRIVE",
  NO_SHOW: "NO_SHOW",
  START: "START",
  FULFILL: "FULFILL",
  RELEASE: "RELEASE",
});

/**
 * State transition matrix.
 * Maps current status + action → next status.
 * @type {Record<SlotStatusKey, Partial<Record<SlotActionKey, SlotStatusKey>>>}
 */
const TRANSITIONS = {
  [SlotStatus.FREE]: {
    [SlotActions.RESERVE]: SlotStatus.PROPOSED,
  },
  [SlotStatus.PROPOSED]: {
    [SlotActions.CONFIRM]: SlotStatus.BOOKED,
    [SlotActions.CANCEL]: SlotStatus.CANCELLED,
    [SlotActions.RELEASE]: SlotStatus.FREE,
  },
  [SlotStatus.BOOKED]: {
    [SlotActions.ARRIVE]: SlotStatus.ARRIVED,
    [SlotActions.NO_SHOW]: SlotStatus.NO_SHOW,
    [SlotActions.RELEASE]: SlotStatus.FREE,
  },
  [SlotStatus.CANCELLED]: {
    [SlotActions.RELEASE]: SlotStatus.FREE,
  },
  [SlotStatus.ARRIVED]: {
    [SlotActions.START]: SlotStatus.IN_PROGRESS,
    [SlotActions.RELEASE]: SlotStatus.FREE,
  },
  [SlotStatus.NO_SHOW]: {
    [SlotActions.RELEASE]: SlotStatus.FREE,
  },
  [SlotStatus.IN_PROGRESS]: {
    [SlotActions.FULFILL]: SlotStatus.FULFILLED,
    [SlotActions.RELEASE]: SlotStatus.FREE,
  },
  [SlotStatus.FULFILLED]: {
    // Terminal state - no transitions allowed
  },
};

/**
 * Roles allowed to execute each action.
 * @type {Record<SlotActionKey, string[]>}
 */
const ACTION_PERMISSIONS = {
  [SlotActions.RESERVE]: [Roles.ADMIN, Roles.SECRETARY, Roles.PATIENT],
  [SlotActions.CONFIRM]: [Roles.ADMIN, Roles.SECRETARY],
  [SlotActions.CANCEL]: [Roles.ADMIN, Roles.SECRETARY],
  [SlotActions.ARRIVE]: [Roles.ADMIN, Roles.SECRETARY],
  [SlotActions.NO_SHOW]: [Roles.ADMIN, Roles.SECRETARY],
  [SlotActions.START]: [Roles.ADMIN, Roles.SECRETARY],
  [SlotActions.FULFILL]: [Roles.ADMIN, Roles.SECRETARY],
  [SlotActions.RELEASE]: [Roles.ADMIN, Roles.SECRETARY],
};

/**
 * Slot State Machine.
 * Encapsulates transition rules and role-based permissions.
 */
export class SlotStateMachine {
  /**
   * Check if a transition is valid.
   * @param {SlotStatusKey} fromStatus - Current slot status.
   * @param {SlotActionKey} action - Action to execute.
   * @returns {boolean} True if transition is allowed.
   */
  static canTransition(fromStatus, action) {
    const transitions = TRANSITIONS[fromStatus];
    return transitions && action in transitions;
  }

  /**
   * Get the next state for a given transition.
   * @param {SlotStatusKey} fromStatus - Current slot status.
   * @param {SlotActionKey} action - Action to execute.
   * @returns {SlotStatusKey | null} Next status or null if invalid.
   */
  static getNextState(fromStatus, action) {
    const transitions = TRANSITIONS[fromStatus];
    if (!transitions) return null;
    return transitions[action] || null;
  }

  /**
   * Check if a role is authorized to execute an action.
   * @param {SlotActionKey} action - Action to execute.
   * @param {string} role - User role.
   * @returns {boolean} True if role is authorized.
   */
  static isRoleAuthorized(action, role) {
    const allowedRoles = ACTION_PERMISSIONS[action];
    return allowedRoles && allowedRoles.includes(role);
  }

  /**
   * Check if status is terminal (no outgoing transitions).
   * @param {SlotStatusKey} status - Status to check.
   * @returns {boolean} True if terminal.
   */
  static isTerminal(status) {
    return status === SlotStatus.FULFILLED;
  }
}
