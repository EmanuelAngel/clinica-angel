/**
 * @import { WaitingListEntry } from "./waiting-list.model.js"
 */

/**
 * @typedef {object} WaitlistFilters
 * @property {number} [page]
 * @property {number} [limit]
 * @property {'asc' | 'desc'} [sort]
 * @property {number} [professionalId]
 * @property {number} [specialtyId]
 */

/**
 * @typedef {object} PaginatedWaitlist
 * @property {WaitingListEntry[]} data
 * @property {number} total
 */

/**
 * @typedef {object} WaitingListRepository
 * @property {(patientId: number, professionalId: number | null, specialtyId: number | null) => Promise<WaitingListEntry>} create
 * Creates a new waiting list entry.
 * @property {(filters: WaitlistFilters) => Promise<PaginatedWaitlist>} findAll
 * Finds all entries with pagination and optional filters.
 * @property {(id: number) => Promise<void>} deleteById
 * Deletes an entry by ID. Throws if not found.
 * @property {(patientId: number, professionalId: number | null, specialtyId: number | null) => Promise<boolean>} existsDuplicate
 * Checks if a duplicate entry exists.
 */
