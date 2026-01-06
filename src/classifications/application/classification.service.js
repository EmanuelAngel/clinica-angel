/**
 * @typedef {import("../domain/classification.repository.js").ClassificationRepository} ClassificationRepository
 */

import { ok, err } from "neverthrow";
import { Classification } from "../domain/classification.model.js";
import {
  ClassificationAlreadyExistsError,
  ClassificationNotFoundError,
} from "../domain/classification.errors.js";

export class ClassificationService {
  /**
   * @param {ClassificationRepository} classificationRepository
   */
  constructor(classificationRepository) {
    this.classificationRepository = classificationRepository;
  }

  /**
   * Find all classifications.
   * @returns {Promise<Classification[]>} All classifications.
   */
  async findAll() {
    return this.classificationRepository.findAll();
  }

  /**
   * Find a classification by ID.
   * @param {number} id
   * @returns {Promise<import("neverthrow").Result<Classification, ClassificationNotFoundError>>}
   */
  async findById(id) {
    const classification = await this.classificationRepository.findById(id);

    if (!classification) {
      return err(new ClassificationNotFoundError(id));
    }

    return ok(classification);
  }

  /**
   * Create a new classification.
   * @param {import("../infrastructure/classification.schemas.js").CreateClassificationDTO} data
   * @returns {Promise<import("neverthrow").Result<Classification, ClassificationAlreadyExistsError>>}
   */
  async create(data) {
    const existingClassification =
      await this.classificationRepository.findByName(data.name);

    if (existingClassification) {
      return err(new ClassificationAlreadyExistsError(data.name));
    }

    const classification = new Classification(0, data.name.trim());
    const created = await this.classificationRepository.create(classification);

    return ok(created);
  }

  /**
   * Update an existing classification.
   * @param {number} id
   * @param {import("../infrastructure/classification.schemas.js").UpdateClassificationDTO} data
   * @returns {Promise<import("neverthrow").Result<Classification, ClassificationNotFoundError | ClassificationAlreadyExistsError>>}
   */
  async update(id, data) {
    const existing = await this.classificationRepository.findById(id);

    if (!existing) {
      return err(new ClassificationNotFoundError(id));
    }

    // Check if another classification with the same name exists
    if (data.name) {
      const duplicateClassification =
        await this.classificationRepository.findByName(data.name);

      if (duplicateClassification && duplicateClassification.id !== id) {
        return err(new ClassificationAlreadyExistsError(data.name));
      }
    }

    const updated = await this.classificationRepository.update(id, data);

    return ok(updated);
  }

  /**
   * Delete a classification by ID.
   * @param {number} id
   * @returns {Promise<import("neverthrow").Result<void, ClassificationNotFoundError>>}
   */
  async delete(id) {
    const existing = await this.classificationRepository.findById(id);

    if (!existing) {
      return err(new ClassificationNotFoundError(id));
    }

    await this.classificationRepository.delete(id);

    return ok(undefined);
  }
}
