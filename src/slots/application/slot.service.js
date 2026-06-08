import { ok, err } from "neverthrow";
import { SlotStatus } from "../../schedules/domain/slot-status.js";
import { SlotStateMachine, SlotActions } from "../domain/slot-state-machine.js";
import { Roles } from "../../auth/domain/roles.js";
import {
  SlotNotFoundError,
  InvalidTransitionError,
  PastSlotModificationForbiddenError,
  InsufficientLeadTimeError,
  ConsultationReasonRequiredError,
  UnauthorizedSlotActionError,
  SlotNotFreeError,
  FulfilledSlotImmutableError,
  OverbookSourceNotProposedError,
  OverbookPerSlotLimitError,
  OverbookPerDayLimitError,
} from "../domain/slot.errors.js";

/**
 * @typedef {import("../domain/slot.repository.js").SlotRepository} SlotRepository
 * @typedef {import("../domain/slot.repository.js").SlotWithDetails} SlotWithDetails
 * @import { Result } from "neverthrow"
 */

/**
 * Minimum lead time in hours for PATIENT reservations.
 */
const PATIENT_LEAD_TIME_HOURS = 48;

/**
 * Minimum consultation reason length.
 */
const MIN_CONSULTATION_REASON_LENGTH = 5;

export class SlotService {
  /**
   * @param {SlotRepository} slotRepository
   */
  constructor(slotRepository) {
    this.slotRepository = slotRepository;
  }

  /**
   * Validates time-based and role-based permissions.
   * @param {SlotWithDetails} slot - The slot to validate.
   * @param {string} role - User role.
   * @param {string} action - Action being performed.
   * @returns {Result<void, PastSlotModificationForbiddenError | InsufficientLeadTimeError>}
   * @private
   */
  _validateTimeAndRole(slot, role, action) {
    const now = new Date();

    // Past slot validation: only ADMIN can modify
    if (slot.startsAt < now && role !== Roles.ADMIN) {
      return err(new PastSlotModificationForbiddenError());
    }

    // 48h lead time for PATIENT reservations
    if (action === SlotActions.RESERVE && role === Roles.PATIENT) {
      const hoursUntilSlot =
        (slot.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilSlot < PATIENT_LEAD_TIME_HOURS) {
        return err(new InsufficientLeadTimeError());
      }
    }

    return ok(undefined);
  }

  /**
   * Reserve a slot (FREE → PROPOSED).
   * @param {number} slotId - Slot ID.
   * @param {string} role - User role performing the action.
   * @param {number} patientId - Patient ID to assign.
   * @param {string} consultationReason - Reason for consultation.
   * @returns {Promise<Result<void,
   *   SlotNotFoundError |
   *   SlotNotFreeError |
   *   UnauthorizedSlotActionError |
   *   PastSlotModificationForbiddenError |
   *   InsufficientLeadTimeError |
   *   ConsultationReasonRequiredError
   * >>}
   */
  async reserve(slotId, role, patientId, consultationReason) {
    // Validate consultation reason
    if (
      !consultationReason ||
      consultationReason.trim().length < MIN_CONSULTATION_REASON_LENGTH
    ) {
      return err(new ConsultationReasonRequiredError());
    }

    // Check role authorization
    if (!SlotStateMachine.isRoleAuthorized(SlotActions.RESERVE, role)) {
      return err(new UnauthorizedSlotActionError(SlotActions.RESERVE));
    }

    // Find slot
    const slot = await this.slotRepository.findById(slotId);
    if (!slot) {
      return err(new SlotNotFoundError(slotId));
    }

    // Validate current status
    if (slot.status !== SlotStatus.FREE) {
      return err(new SlotNotFreeError());
    }

    // Validate time and role constraints
    const timeValidation = this._validateTimeAndRole(
      slot,
      role,
      SlotActions.RESERVE
    );
    if (timeValidation.isErr()) {
      return timeValidation;
    }

    // Execute reservation
    await this.slotRepository.reserve(
      slotId,
      patientId,
      consultationReason.trim()
    );
    return ok(undefined);
  }

  /**
   * Execute a simple status transition.
   * @param {number} slotId - Slot ID.
   * @param {string} role - User role.
   * @param {string} action - Action to execute.
   * @returns {Promise<Result<void,
   *   SlotNotFoundError |
   *   InvalidTransitionError |
   *   UnauthorizedSlotActionError |
   *   PastSlotModificationForbiddenError |
   *   FulfilledSlotImmutableError
   * >>}
   * @private
   */
  async _executeTransition(slotId, role, action) {
    // Check role authorization
    if (!SlotStateMachine.isRoleAuthorized(action, role)) {
      return err(new UnauthorizedSlotActionError(action));
    }

    // Find slot
    const slot = await this.slotRepository.findById(slotId);
    if (!slot) {
      return err(new SlotNotFoundError(slotId));
    }

    // Check if terminal state
    if (SlotStateMachine.isTerminal(slot.status)) {
      return err(new FulfilledSlotImmutableError());
    }

    // Validate transition
    if (!SlotStateMachine.canTransition(slot.status, action)) {
      return err(new InvalidTransitionError(slot.status, action));
    }

    // Validate time constraints (past slot check)
    const timeValidation = this._validateTimeAndRole(slot, role, action);
    if (timeValidation.isErr()) {
      return timeValidation;
    }

    // Get next state and update
    const nextStatus = SlotStateMachine.getNextState(slot.status, action);
    await this.slotRepository.updateStatus(slotId, nextStatus);
    return ok(undefined);
  }

  /**
   * Confirm a slot (PROPOSED → BOOKED).
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<import("neverthrow").Result<void, import("../domain/slot.errors.js").SlotNotFoundError | import("../domain/slot.errors.js").InvalidTransitionError | import("../domain/slot.errors.js").UnauthorizedSlotActionError | import("../domain/slot.errors.js").PastSlotModificationForbiddenError | import("../domain/slot.errors.js").FulfilledSlotImmutableError>>}
   */
  async confirm(slotId, role) {
    return this._executeTransition(slotId, role, SlotActions.CONFIRM);
  }

  /**
   * Cancel a slot (PROPOSED → CANCELLED).
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<import("neverthrow").Result<void, import("../domain/slot.errors.js").SlotNotFoundError | import("../domain/slot.errors.js").InvalidTransitionError | import("../domain/slot.errors.js").UnauthorizedSlotActionError | import("../domain/slot.errors.js").PastSlotModificationForbiddenError | import("../domain/slot.errors.js").FulfilledSlotImmutableError>>}
   */
  async cancel(slotId, role) {
    return this._executeTransition(slotId, role, SlotActions.CANCEL);
  }

  /**
   * Mark patient as arrived (BOOKED → ARRIVED).
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<import("neverthrow").Result<void, import("../domain/slot.errors.js").SlotNotFoundError | import("../domain/slot.errors.js").InvalidTransitionError | import("../domain/slot.errors.js").UnauthorizedSlotActionError | import("../domain/slot.errors.js").PastSlotModificationForbiddenError | import("../domain/slot.errors.js").FulfilledSlotImmutableError>>}
   */
  async markArrived(slotId, role) {
    return this._executeTransition(slotId, role, SlotActions.ARRIVE);
  }

  /**
   * Mark patient as no-show (BOOKED → NO_SHOW).
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<import("neverthrow").Result<void, import("../domain/slot.errors.js").SlotNotFoundError | import("../domain/slot.errors.js").InvalidTransitionError | import("../domain/slot.errors.js").UnauthorizedSlotActionError | import("../domain/slot.errors.js").PastSlotModificationForbiddenError | import("../domain/slot.errors.js").FulfilledSlotImmutableError>>}
   */
  async markNoShow(slotId, role) {
    return this._executeTransition(slotId, role, SlotActions.NO_SHOW);
  }

  /**
   * Start consultation (ARRIVED → IN_PROGRESS).
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<import("neverthrow").Result<void, import("../domain/slot.errors.js").SlotNotFoundError | import("../domain/slot.errors.js").InvalidTransitionError | import("../domain/slot.errors.js").UnauthorizedSlotActionError | import("../domain/slot.errors.js").PastSlotModificationForbiddenError | import("../domain/slot.errors.js").FulfilledSlotImmutableError>>}
   */
  async startConsultation(slotId, role) {
    return this._executeTransition(slotId, role, SlotActions.START);
  }

  /**
   * Mark as fulfilled (IN_PROGRESS → FULFILLED).
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<import("neverthrow").Result<void, import("../domain/slot.errors.js").SlotNotFoundError | import("../domain/slot.errors.js").InvalidTransitionError | import("../domain/slot.errors.js").UnauthorizedSlotActionError | import("../domain/slot.errors.js").PastSlotModificationForbiddenError | import("../domain/slot.errors.js").FulfilledSlotImmutableError>>}
   */
  async markFulfilled(slotId, role) {
    return this._executeTransition(slotId, role, SlotActions.FULFILL);
  }

  /**
   * Release a slot (any except FREE/FULFILLED → FREE).
   * Clears patientId and consultationReason.
   * @param {number} slotId
   * @param {string} role
   * @returns {Promise<Result<void,
   *   SlotNotFoundError |
   *   InvalidTransitionError |
   *   UnauthorizedSlotActionError |
   *   PastSlotModificationForbiddenError |
   *   FulfilledSlotImmutableError
   * >>}
   */
  async release(slotId, role) {
    // Check role authorization
    if (!SlotStateMachine.isRoleAuthorized(SlotActions.RELEASE, role)) {
      return err(new UnauthorizedSlotActionError(SlotActions.RELEASE));
    }

    // Find slot
    const slot = await this.slotRepository.findById(slotId);
    if (!slot) {
      return err(new SlotNotFoundError(slotId));
    }

    // Check if terminal state
    if (SlotStateMachine.isTerminal(slot.status)) {
      return err(new FulfilledSlotImmutableError());
    }

    // Validate transition
    if (!SlotStateMachine.canTransition(slot.status, SlotActions.RELEASE)) {
      return err(new InvalidTransitionError(slot.status, SlotActions.RELEASE));
    }

    // Validate time constraints
    const timeValidation = this._validateTimeAndRole(
      slot,
      role,
      SlotActions.RELEASE
    );
    if (timeValidation.isErr()) {
      return timeValidation;
    }

    // Release slot (clears patient data)
    await this.slotRepository.release(slotId);
    return ok();
  }

  /**
   * Create an overbook slot from an existing BOOKED slot.
   * @param {number} sourceSlotId - ID of the source BOOKED slot.
   * @param {number} patientId - Patient ID for the overbook.
   * @param {string} consultationReason - Consultation reason.
   * @returns {Promise<Result<number,
   *   SlotNotFoundError |
   *   OverbookSourceNotProposedError |
   *   OverbookPerSlotLimitError |
   *   OverbookPerDayLimitError
   * >>}
   */
  async createOverbook(sourceSlotId, patientId, consultationReason) {
    // Find source slot
    const sourceSlot = await this.slotRepository.findById(sourceSlotId);
    if (!sourceSlot) {
      return err(new SlotNotFoundError(sourceSlotId));
    }

    // Source slot must be PROPOSED
    if (sourceSlot.status !== SlotStatus.PROPOSED) {
      return err(new OverbookSourceNotProposedError());
    }

    // Get schedule limits
    const limits = await this.slotRepository.findScheduleLimits(
      sourceSlot.scheduleId
    );
    if (!limits) {
      return err(new SlotNotFoundError(sourceSlotId));
    }

    // Per-slot limit
    const overbooksAtTime =
      await this.slotRepository.countActiveOverbooksByTime(
        sourceSlot.scheduleId,
        sourceSlot.startsAt
      );
    if (overbooksAtTime >= limits.maxOverbooksPerSlot) {
      return err(new OverbookPerSlotLimitError());
    }

    // Per-day limit
    const dayStart = new Date(sourceSlot.startsAt);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const overbooksOnDay = await this.slotRepository.countActiveOverbooksByDay(
      sourceSlot.scheduleId,
      dayStart,
      dayEnd
    );
    if (overbooksOnDay >= limits.maxOverbooksPerDay) {
      return err(new OverbookPerDayLimitError());
    }

    // Create overbook
    const newSlotId = await this.slotRepository.createOverbook({
      scheduleId: sourceSlot.scheduleId,
      startsAt: sourceSlot.startsAt,
      patientId,
      consultationReason,
    });

    return ok(newSlotId);
  }
}
