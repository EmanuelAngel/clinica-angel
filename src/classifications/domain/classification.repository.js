/**
 * @typedef {import('./classification.model.js').Classification} Classification
 * @typedef {object} ClassificationRepository
 * @property {function(): Promise<Classification[]>} findAll
 * Find all classifications or return an empty array.
 * @property {function(number): Promise<Classification | null>} findById
 * Find by ID or return null.
 * @property {function(string): Promise<Classification | null>} findByName
 * Find by name (case-insensitive) or return null.
 * @property {function(Classification): Promise<Classification>} create
 * Create a new classification and return it with the generated ID.
 * @property {function(number, Partial<Classification>): Promise<Classification>} update
 * Update an existing classification and return it.
 * @property {function(number): Promise<void>} delete
 * Delete a classification by ID.
 */
