/**
 * @typedef {import('./specialty.model.js').Specialty} Specialty
 * @typedef {object} SpecialtyRepository
 * @property {function(): Promise<Specialty[]>} findAll
 * Find all active specialties or return an empty array.
 * @property {function(number): Promise<Specialty | null>} findById
 * Find by ID or return null.
 * @property {function(string): Promise<Specialty | null>} findByName
 * Find by name (case-insensitive) or return null.
 * @property {function(Specialty): Promise<Specialty>} create
 * Create a new specialty and return it with the generated ID.
 */
