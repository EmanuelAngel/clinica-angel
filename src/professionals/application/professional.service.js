/**
 * @typedef {import("../domain/professional.repository.js").ProfessionalRepository} ProfessionalRepository
 * @typedef {import("../../specialties/domain/specialty.repository.js").SpecialtyRepository} SpecialtyRepository
 * @typedef {import("../../users/domain/user.repository.js").UserRepository} UserRepository
 * @typedef {import("../../users/domain/password-hasher.model.js").PasswordHasher} PasswordHasher
 */

import { ok, err } from "neverthrow";
import {
  Professional,
  ProfessionalCredential,
} from "../domain/professional.model.js";
import {
  LicenseAlreadyExistsError,
  ProfessionalNotFoundError,
  CredentialSpecialtyNotFoundError,
} from "../domain/professional.errors.js";
import {
  EmailAlreadyInUseError,
  NationalIdAlreadyInUseError,
} from "../../users/domain/user.errors.js";
import { Roles } from "../../auth/domain/roles.js";

export class ProfessionalService {
  /**
   * @param {ProfessionalRepository} professionalRepository
   * @param {SpecialtyRepository} specialtyRepository
   * @param {UserRepository} userRepository
   * @param {PasswordHasher} passwordHasher
   */
  constructor(
    professionalRepository,
    specialtyRepository,
    userRepository,
    passwordHasher
  ) {
    this.professionalRepository = professionalRepository;
    this.specialtyRepository = specialtyRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  /**
   * Find all active professionals.
   * @returns {Promise<Professional[]>} All active professionals.
   */
  async findAll() {
    return this.professionalRepository.findAll();
  }

  /**
   * Get a professional's profile by ID.
   * @param {number} id - Professional (user) ID.
   * @returns {Promise<import("neverthrow").Result<Professional, ProfessionalNotFoundError>>}
   * Returns:
   * `Professional` -> When the professional is found.
   * `ProfessionalNotFoundError` -> When the professional is not found.
   */
  async getProfile(id) {
    const professional = await this.professionalRepository.findById(id);

    if (!professional) {
      return err(new ProfessionalNotFoundError(id));
    }

    return ok(professional);
  }

  /**
   * Create a new professional.
   * @param {import("../infrastructure/professional.schemas.js").CreateProfessionalDTO} data
   * @returns {Promise<import("neverthrow").Result<
   *   Professional,
   *   EmailAlreadyInUseError |
   *   NationalIdAlreadyInUseError |
   *   LicenseAlreadyExistsError |
   *   CredentialSpecialtyNotFoundError
   * >>}
   * - `Professional` -> When the professional is successfully created.
   * - `EmailAlreadyInUseError` -> When the email is already in use.
   * - `NationalIdAlreadyInUseError` -> When the national ID is already in use.
   * - `LicenseAlreadyExistsError` -> When the license number already exists.
   * - `CredentialSpecialtyNotFoundError` -> When the specialty is not found.
   */
  async create(data) {
    // Check if email is already in use
    const existingUserByEmail = await this.userRepository.findByEmail(
      data.email
    );
    if (existingUserByEmail) {
      return err(new EmailAlreadyInUseError(data.email));
    }

    // Check if national ID is already used for this role
    const existingUserByNationalId =
      await this.userRepository.findByNationalIdAndRole(
        data.nationalId,
        Roles.PROFESSIONAL
      );
    if (existingUserByNationalId) {
      return err(
        new NationalIdAlreadyInUseError(data.nationalId, Roles.PROFESSIONAL)
      );
    }

    // Validate credentials (if any)
    const credentials = data.credentials || [];
    for (const cred of credentials) {
      // Check if license number already exists
      const existingLicense =
        await this.professionalRepository.findByLicenseNumber(
          cred.licenseNumber
        );
      if (existingLicense) {
        return err(new LicenseAlreadyExistsError(cred.licenseNumber));
      }

      // Check if specialty exists
      const specialty = await this.specialtyRepository.findById(
        cred.specialtyId
      );
      if (!specialty) {
        return err(new CredentialSpecialtyNotFoundError(cred.specialtyId));
      }
    }

    // Hash the password
    const passwordHash = await this.passwordHasher.hash(data.password);

    // Build domain model
    const professional = new Professional({
      id: 0,
      email: data.email,
      firstNames: data.firstNames,
      lastNames: data.lastNames,
      nationalId: data.nationalId,
      phone: data.phone,
      address: data.address,
      credentials: credentials.map(
        (c) => new ProfessionalCredential(c.licenseNumber, c.specialtyId, "")
      ),
    });

    const created = await this.professionalRepository.create(
      professional,
      passwordHash
    );

    return ok(created);
  }
}
