import { ok, err } from "neverthrow";
import { CustomError } from "../../_shared/domain/custom-error.js";
import { Roles } from "../../auth/domain/roles.js";
import { Patient, PatientHealthInsurance } from "../domain/patient.model.js";
import {
  EmailAlreadyInUseError,
  NationalIdAlreadyInUseError,
  HealthInsuranceNotFoundError,
  MemberNumberDuplicateError,
} from "../domain/patient.errors.js";

/**
 * @typedef {import("../domain/patient.repository.js").PatientRepository} PatientRepository
 * @typedef {import("../../health-insurances/domain/health-insurance.repository.js").HealthInsuranceRepository} HealthInsuranceRepository
 * @typedef {import("../../users/domain/user.repository.js").UserRepository} UserRepository
 * @typedef {import("../../users/domain/password-hasher.model.js").PasswordHasher} PasswordHasher
 */

export class PatientService {
  /**
   * @param {PatientRepository} patientRepository
   * @param {HealthInsuranceRepository} healthInsuranceRepository
   * @param {UserRepository} userRepository
   * @param {PasswordHasher} passwordHasher
   */
  constructor(
    patientRepository,
    healthInsuranceRepository,
    userRepository,
    passwordHasher
  ) {
    this.patientRepository = patientRepository;
    this.healthInsuranceRepository = healthInsuranceRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  /**
   * @typedef {import("../infrastructure/patient.schemas.js").PatientRegistrationDTO} PatientRegistrationDTO
   * @param {PatientRegistrationDTO} data The validated patient registration data.
   * @returns {Promise<import("neverthrow").Result<
   *   void,
   *   EmailAlreadyInUseError |
   *   NationalIdAlreadyInUseError |
   *   HealthInsuranceNotFoundError |
   *   MemberNumberDuplicateError>
   * >}
   * Returns void when the patient is successfully registered.
   *
   * Returns specific errors when something goes wrong:
   * - `EmailAlreadyInUseError` The patient already exists.
   * - `NationalIdAlreadyInUseError` The patient already exists with the same
   *   national ID and role.
   * - `HealthInsuranceNotFoundError` Any of the provided health insurance does
   *   not exist.
   * - `MemberNumberDuplicateError` Any of the provided health insurances member
   *   numbers already exists.
   */
  async register(data) {
    const patientExists = await this.patientRepository.findByEmail(data.email);

    if (patientExists) {
      return err(new EmailAlreadyInUseError(data.email));
    }

    const foundWithNationalIdAndRole =
      await this.userRepository.findByNationalIdAndRole(
        data.nationalId,
        Roles.PATIENT
      );

    if (foundWithNationalIdAndRole) {
      return err(
        new NationalIdAlreadyInUseError(
          data.nationalId,
          foundWithNationalIdAndRole.role
        )
      );
    }

    /** @type {PatientHealthInsurance[]} */
    const patientHealthInsurances = [];

    for (const insurance of data.healthInsurances || []) {
      const insuranceFound = await this.healthInsuranceRepository.findById(
        insurance.insuranceId
      );

      if (!insuranceFound) {
        return err(new HealthInsuranceNotFoundError(insurance.insuranceId));
      }

      const isDuplicate = await this.patientRepository.existsMemberNumber(
        insurance.insuranceId,
        insurance.memberNumber
      );

      if (isDuplicate) {
        return err(
          new MemberNumberDuplicateError(
            insurance.memberNumber,
            insuranceFound.name
          )
        );
      }

      patientHealthInsurances.push(
        new PatientHealthInsurance(insuranceFound, insurance.memberNumber)
      );
    }

    const hashedPassword = await this.passwordHasher.hash(data.password);

    const patient = new Patient({
      id: 0,
      role: Roles.PATIENT,
      passwordHash: hashedPassword,
      ...data,
      nationalIdImageUrl: data.nationalIdImageUrl,
      healthInsurances: patientHealthInsurances,
    });

    await this.patientRepository.register(patient);
    return ok(undefined);
  }

  /**
   * @param {string} userId
   * @returns {Promise<Patient>} The patient profile.
   * @throws {CustomError} When the patient does not exist.
   */
  async getProfile(userId) {
    const patient = await this.patientRepository.findById(userId);

    if (!patient) {
      throw new CustomError("No se encontró el paciente", 404);
    }

    return patient;
  }

  /**
   * List all patients.
   * @returns {Promise<Patient[]>} All patients. If no patients are found, an
   * empty array is returned.
   */
  async listAll() {
    return this.patientRepository.findAll();
  }
}
