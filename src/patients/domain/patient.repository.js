/**
 * @typedef {import('./patient.model.js').Patient} Patient
 * @typedef {object} PatientRepository
 * @property {function(Patient): Promise<void>} register
 * Register a new patient.
 * @property {function(string): Promise<null | Patient>} findById
 * Find by ID or return null.
 * @property {function(string): Promise<null | Patient>} findByEmail
 * Find by email or return null.
 * @property {function(): Promise<Patient[]>} findAll
 * Find all patients or return an empty array.
 * @property {function(string): Promise<void>} deactivate
 * Deactivates a patient.
 * @property {(insuranceId: number, memberNumber: string) => Promise<boolean>} existsMemberNumber
 * Checks if the member number is already linked with the specified insurance.
 * @property {(nationalId: string) => Promise<Patient | null>} findByNationalId
 * Find a patient by national ID (DNI) or return null.
 */

/*
TypeScript equivalent:

export interface PatientRepository {
  save: () => Promise<void>;
  findById: (id: string) => Promise<null | number>;
  findAll: () => Promise<Patient[]>;
  deactivate: (id: string) => Promise<void>;
}
*/
