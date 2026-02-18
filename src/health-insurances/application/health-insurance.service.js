// eslint-disable-next-line no-unused-vars
import { HealthInsurance } from "../domain/health-insurance.model.js";

export class HealthInsuranceService {
  /**
   * @param {import("../domain/health-insurance.repository.js").HealthInsuranceRepository} healthInsuranceRepository
   */
  constructor(healthInsuranceRepository) {
    this.healthInsuranceRepository = healthInsuranceRepository;
  }

  /**
   * Find all health insurances or return an empty array.
   * @param {{ includeDeleted?: boolean }} options
   * @returns {Promise<HealthInsurance[]>} Health insurances.
   */
  async findAll(options = { includeDeleted: false }) {
    return this.healthInsuranceRepository.findAll(options);
  }
}
