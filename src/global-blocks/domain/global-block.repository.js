/**
 * @import { GlobalBlock } from "./global-block.model.js"
 */

/**
 * @typedef {object} GlobalBlockRepository
 * @property {() => Promise<GlobalBlock[]>} findAll
 * Find all global blocks ordered by start date ascending.
 * @property {(id: number) => Promise<GlobalBlock | null>} findById
 * Find a global block by ID or return null.
 * @property {(data: { startDate: Date, endDate: Date, reason: string }) => Promise<GlobalBlock>} create
 * Create a new global block and return it with the generated ID.
 * @property {(id: number, data: { startDate: Date, endDate: Date, reason: string }) => Promise<GlobalBlock>} update
 * Update an existing global block and return it.
 * @property {(id: number) => Promise<void>} delete
 * Delete a global block by ID.
 */
