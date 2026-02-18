/**
 * @typedef {import('./health-insurance.model.js').HealthInsurance} HealthInsurance
 * @typedef {object} HealthInsuranceRepository
 * @property {function({ includeDeleted?: boolean }=): Promise<HealthInsurance[]>} findAll
 * Find all health insurances or return an empty array.
 * @property {function(number): Promise<HealthInsurance | null>} findById
 * Find by ID or return null.
 */
