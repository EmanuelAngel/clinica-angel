/**
 * @typedef {import("../domain/location.repository.js").LocationRepository} LocationRepository
 */

import { ok, err } from "neverthrow";
import {
  LocationNotFoundError,
  LocationNameAlreadyExistsError,
} from "../domain/location.errors.js";

export class LocationService {
  /**
   * @param {LocationRepository} locationRepository
   */
  constructor(locationRepository) {
    this.locationRepository = locationRepository;
  }

  /**
   * Find all locations.
   * @returns {Promise<import("../domain/location.model.js").Location[]>} The list of locations.
   */
  async findAll() {
    return this.locationRepository.findAll();
  }

  /**
   * Find a location by ID.
   * @param {number} id
   * @returns {Promise<import("neverthrow").Result<import("../domain/location.model.js").Location, LocationNotFoundError>>} The location result.
   */
  async findById(id) {
    const location = await this.locationRepository.findById(id);

    if (!location) {
      return err(new LocationNotFoundError());
    }

    return ok(location);
  }

  /**
   * Create a new location.
   * @param {import("../infrastructure/location.schemas.js").CreateLocationDTO} data
   * @returns {Promise<import("neverthrow").Result<import("../domain/location.model.js").Location, Error | LocationNameAlreadyExistsError>>} The created location result.
   */
  async create(data) {
    const existing = await this.locationRepository.findByName(data.name);

    if (existing) {
      return err(new LocationNameAlreadyExistsError(data.name));
    }

    const created = await this.locationRepository.create({
      ...data,
      phone: data.phone || null,
    });
    return ok(created);
  }

  /**
   * Update an existing location.
   * @param {number} id
   * @param {import("../infrastructure/location.schemas.js").UpdateLocationDTO} data
   * @returns {Promise<import("neverthrow").Result<import("../domain/location.model.js").Location, LocationNotFoundError>>} The updated location result.
   */
  async update(id, data) {
    const existing = await this.locationRepository.findById(id);

    if (!existing) {
      return err(new LocationNotFoundError());
    }

    const updated = await this.locationRepository.update(id, data);
    return ok(updated);
  }
}
