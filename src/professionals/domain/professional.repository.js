/**
 * @typedef {import('./professional.model.js').Professional} Professional
 * @typedef {import('./professional.model.js').ProfessionalCredential} ProfessionalCredential
 * @typedef {object} ProfessionalRepository
 * @property {function(): Promise<Professional[]>} findAll
 * Find all active professionals or return an empty array.
 * @property {function(number): Promise<Professional | null>} findById
 * Find by user ID or return null.
 * @property {function(string): Promise<ProfessionalCredential | null>} findByLicenseNumber
 * Find credential by license number or return null.
 * @property {function(Professional, string): Promise<Professional>} create
 * Create a new professional with user data and hashed password. Returns the created professional.
 */
