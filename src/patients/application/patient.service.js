import { ok, err } from "neverthrow";
import { Roles } from "../../auth/domain/roles.js";
import { Patient, PatientHealthInsurance } from "../domain/patient.model.js";
import {
  EmailAlreadyInUseError,
  NationalIdAlreadyInUseError,
  HealthInsuranceNotFoundError,
  MemberNumberDuplicateError,
  PatientNotFoundError,
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
   * @returns {Promise<import("neverthrow").Result<Patient, PatientNotFoundError>>} The patient profile.
   */
  async getProfile(userId) {
    const patient = await this.patientRepository.findById(userId);

    if (!patient) {
      return err(new PatientNotFoundError(userId));
    }

    return ok(patient);
  }

  /**
   * @param {string} userId
   * @returns {Promise<import("neverthrow").Result<{
   *   patient: Patient,
   *   slotsPast: any[],
   *   slotsToday: any[],
   *   slotsFuture: any[]
   * }, PatientNotFoundError>>} The patient profile with partitioned slots.
   */
  async getProfileWithSlots(userId) {
    const rawPatient = await this.patientRepository.findByIdWithSlots(userId);

    if (!rawPatient) {
      return err(new PatientNotFoundError(userId));
    }

    const patient = this.patientRepository.mapToDomain(rawPatient);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const slotsPast = [];
    const slotsToday = [];
    const slotsFuture = [];

    for (const slot of rawPatient.requestedSlots) {
      const displaySlot = {
        id: slot.id,
        startsAt: slot.startsAt,
        status: slot.status,
        professionalName: `${slot.schedule.professional.user.firstNames} ${slot.schedule.professional.user.lastNames}`,
        specialty: slot.schedule.classification.name,
        location: slot.schedule.location.name,
      };

      if (slot.startsAt < todayStart) {
        slotsPast.push(displaySlot);
      } else if (slot.startsAt > todayEnd) {
        slotsFuture.push(displaySlot);
      } else {
        slotsToday.push(displaySlot);
      }
    }

    return ok({
      patient,
      slotsPast,
      slotsToday,
      slotsFuture,
    });
  }

  /**
   * Updates a patient's basic profile.
   * @param {string} id User ID.
   * @param {import("../../users/infrastructure/user.schemas.js").UpdateProfileDTO} data Updated fields.
   * @returns {Promise<import("neverthrow").Result<void, PatientNotFoundError>>}
   */
  async updateProfile(id, data) {
    const patientResult = await this.getProfile(id);

    if (patientResult.isErr()) {
      return err(patientResult.error);
    }

    await this.patientRepository.update(id, data);
    return ok(undefined);
  }

  /**
   * Find a patient by national ID (DNI).
   * @param {string} nationalId
   * @returns {Promise<import("../domain/patient.model.js").Patient | null>}
   */
  async findByNationalId(nationalId) {
    return this.patientRepository.findByNationalId(nationalId);
  }

  /**
   * List all patients.
   * @returns {Promise<import("../domain/patient.model.js").Patient[]>}
   */
  async listAll() {
    return this.patientRepository.findAll();
  }
}
