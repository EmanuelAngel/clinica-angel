/**
 * @typedef {import("./user.model.js").User} User
 * @typedef {import("../../auth/domain/roles.js").Role} Role
 * @typedef {object} UserRepository
 * @property {function(User): Promise<void>} register
 * Register a new user.
 * @property {function(): Promise<User[]>} findAll
 * Find all users or return an empty array.
 * @property {function(string): Promise<null | User>} findByEmail
 * Find by email or return null.
 * @property {function(string, Role): Promise<null | User>} findByNationalIdAndRole
 * Find by national ID and role or return null.
 * @property {function(number): Promise<null | User>} findById
 * Find by ID or return null.
 */
