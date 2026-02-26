/**
 * @import { GlobalBlockRepository } from "../domain/global-block.repository.js"
 * @import { GlobalBlock } from "../domain/global-block.model.js"
 */

import { ok, err } from "neverthrow";
import {
  GlobalBlockNotFoundError,
  GlobalBlockInPastError,
} from "../domain/global-block.errors.js";

export class GlobalBlockService {
  /**
   * @param {GlobalBlockRepository} globalBlockRepository
   */
  constructor(globalBlockRepository) {
    this.globalBlockRepository = globalBlockRepository;
  }

  /**
   * Find all global blocks.
   * @returns {Promise<GlobalBlock[]>}
   */
  async findAll() {
    return this.globalBlockRepository.findAll();
  }

  /**
   * Create a new global block.
   * @param {import("../infrastructure/global-block.schemas.js").CreateGlobalBlockDTO} data
   * @returns {Promise<import("neverthrow").Result<GlobalBlock, GlobalBlockInPastError>>}
   */
  async create(data) {
    if (this.isEntirelyInPast(data.startDate, data.endDate)) {
      return err(new GlobalBlockInPastError());
    }

    const created = await this.globalBlockRepository.create(data);
    return ok(created);
  }

  /**
   * Update an existing global block.
   * @param {number} id
   * @param {import("../infrastructure/global-block.schemas.js").UpdateGlobalBlockDTO} data
   * @returns {Promise<import("neverthrow").Result<
   *   GlobalBlock,
   *   GlobalBlockNotFoundError | GlobalBlockInPastError
   * >>}
   */
  async update(id, data) {
    const existing = await this.globalBlockRepository.findById(id);

    if (!existing) {
      return err(new GlobalBlockNotFoundError(id));
    }

    if (this.isEntirelyInPast(existing.startDate, existing.endDate)) {
      return err(new GlobalBlockInPastError());
    }

    if (this.isEntirelyInPast(data.startDate, data.endDate)) {
      return err(new GlobalBlockInPastError());
    }

    const updated = await this.globalBlockRepository.update(id, data);
    return ok(updated);
  }

  /**
   * Delete a global block.
   * @param {number} id
   * @returns {Promise<import("neverthrow").Result<
   *   void,
   *   GlobalBlockNotFoundError | GlobalBlockInPastError
   * >>}
   */
  async delete(id) {
    const existing = await this.globalBlockRepository.findById(id);

    if (!existing) {
      return err(new GlobalBlockNotFoundError(id));
    }

    if (this.isEntirelyInPast(existing.startDate, existing.endDate)) {
      return err(new GlobalBlockInPastError());
    }

    await this.globalBlockRepository.delete(id);
    return ok(undefined);
  }

  /**
   * Checks if a block's date range is entirely in the past.
   * A block is in the past if its endDate is before today (local midnight).
   * @param {Date} _startDate
   * @param {Date} endDate
   * @returns {boolean}
   */
  isEntirelyInPast(_startDate, endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }
}
