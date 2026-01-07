/**
 * @typedef {import("./location.model.js").Location} Location
 * @typedef {object} LocationRepository
 * @property {function(Omit<Location, "id" | "deletedAt">): Promise<Location>} create
 * Create a new location and return it with the generated ID.
 * @property {function(): Promise<Location[]>} findAll
 * Find all locations or return an empty array.
 * @property {function(number): Promise<Location | null>} findById
 * Find by ID or return null.
 * @property {function(number, Partial<Omit<Location, "id" | "deletedAt">>): Promise<Location>} update
 * Update an existing location and return it.
 * @property {function(string): Promise<Location | null>} findByName
 * Find by name (case-insensitive) or return null.
 */
