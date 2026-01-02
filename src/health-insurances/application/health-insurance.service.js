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
   * @returns {Promise<HealthInsurance[]>} All **active** health insurances.
   */
  async findAll() {
    return this.healthInsuranceRepository.findAll();
  }
}
