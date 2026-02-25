/**
 * @import { Result } from "neverthrow"
 * @import { WaitingListEntry } from "../domain/waiting-list.model.js"
 * @import { WaitingListRepository, WaitlistFilters, PaginatedWaitlist } from "../domain/waiting-list.repository.js"
 * @import { PatientRepository } from "../../patients/domain/patient.repository.js"
 */

import { ok, err } from "neverthrow";
import {
  PatientNotFoundByDniError,
  DuplicateWaitlistEntryError,
  WaitlistEntryNotFoundError,
  InvalidWaitlistAssignmentError,
} from "../domain/waiting-list.errors.js";

export class WaitingListService {
  /**
   * @param {WaitingListRepository} waitingListRepository
   * @param {PatientRepository} patientRepository
   */
  constructor(waitingListRepository, patientRepository) {
    this.waitingListRepository = waitingListRepository;
    this.patientRepository = patientRepository;
  }

  /**
   * Create a new waiting list entry.
   * @param {import("../infrastructure/waiting-list.schemas.js").CreateWaitlistDTO} dto
   * @returns {Promise<Result<
   *   WaitingListEntry,
   *   PatientNotFoundByDniError |
   *   InvalidWaitlistAssignmentError |
   *   DuplicateWaitlistEntryError
   * >>}
   * - `WaitingListEntry` → When the entry is successfully created.
   * - `PatientNotFoundByDniError` → When no patient matches the given DNI.
   * - `InvalidWaitlistAssignmentError` → When neither professional nor specialty is provided.
   * - `DuplicateWaitlistEntryError` → When the same combination already exists.
   */
  async create(dto) {
    const { dni, professionalId, specialtyId } = dto;

    // At least one must be provided
    if (!professionalId && !specialtyId) {
      return err(new InvalidWaitlistAssignmentError());
    }

    // Find patient by DNI
    const patient = await this.patientRepository.findByNationalId(dni);
    if (!patient) {
      return err(new PatientNotFoundByDniError(dni));
    }

    // Check for duplicates
    const isDuplicate = await this.waitingListRepository.existsDuplicate(
      patient.id,
      professionalId || null,
      specialtyId || null
    );

    if (isDuplicate) {
      return err(new DuplicateWaitlistEntryError());
    }

    const entry = await this.waitingListRepository.create(
      patient.id,
      professionalId || null,
      specialtyId || null
    );

    return ok(entry);
  }

  /**
   * List waiting list entries with pagination and filters.
   * @param {WaitlistFilters} filters
   * @returns {Promise<PaginatedWaitlist>}
   */
  async list(filters) {
    return this.waitingListRepository.findAll(filters);
  }

  /**
   * Delete a waiting list entry by ID (hard delete).
   * @param {number} id
   * @returns {Promise<Result<void, WaitlistEntryNotFoundError>>}
   * - `void` → When the entry is successfully deleted.
   * - `WaitlistEntryNotFoundError` → When no entry with the given ID exists.
   */
  async delete(id) {
    try {
      await this.waitingListRepository.deleteById(id);
      return ok(undefined);
    } catch {
      return err(new WaitlistEntryNotFoundError(id));
    }
  }
}
