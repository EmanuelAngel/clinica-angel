/**
 * @typedef {import("../domain/specialty.repository.js").SpecialtyRepository} SpecialtyRepository
 */

import { ok, err } from "neverthrow";
import { Specialty } from "../domain/specialty.model.js";
import { SpecialtyAlreadyExistsError } from "../domain/specialty.errors.js";

export class SpecialtyService {
  /**
   * @param {SpecialtyRepository} specialtyRepository
   */
  constructor(specialtyRepository) {
    this.specialtyRepository = specialtyRepository;
  }

  /**
   * Find all active specialties.
   * @returns {Promise<Specialty[]>} All active specialties.
   */
  async findAll() {
    return this.specialtyRepository.findAll();
  }

  /**
   * Create a new specialty.
   * @param {import("../infrastructure/specialty.schemas.js").CreateSpecialtyDTO} data
   * @returns {Promise<import("neverthrow").Result<Specialty, SpecialtyAlreadyExistsError>>}
   */
  async create(data) {
    const existingSpecialty = await this.specialtyRepository.findByName(
      data.name
    );

    if (existingSpecialty) {
      return err(new SpecialtyAlreadyExistsError(data.name));
    }

    const specialty = new Specialty(0, data.name.trim());
    const created = await this.specialtyRepository.create(specialty);

    return ok(created);
  }
}
