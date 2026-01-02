import { CustomError } from "../../_shared/domain/custom-error.js";
import { Roles } from "../../auth/domain/roles.js";
import { Patient, PatientHealthInsurance } from "../domain/patient.model.js";

/**
 * @typedef {import("../domain/patient.repository.js").PatientRepository} PatientRepository
 * @typedef {import("../../health-insurances/domain/health-insurance.repository.js").HealthInsuranceRepository} HealthInsuranceRepository
 * @typedef {import("../../users/domain/user.repository.js").UserRepository} UserRepository
 */

export class PatientService {
  /**
   * @param {PatientRepository} patientRepository
   * @param {HealthInsuranceRepository} healthInsuranceRepository
   * @param {UserRepository} userRepository
   */
  constructor(patientRepository, healthInsuranceRepository, userRepository) {
    this.patientRepository = patientRepository;
    this.healthInsuranceRepository = healthInsuranceRepository;
    this.userRepository = userRepository;
  }

  /**
   * @param {import("../infrastructure/patient.schemas.js").PatientRegistrationDTO} data
   * @throws {CustomError} When the patient already exists.
   * @throws {CustomError} When any of the insurances does not exist.
   * @throws {CustomError} When any of the insurances name does not match.
   */
  async register(data) {
    const patientExists = await this.patientRepository.findByEmail(data.email);

    if (patientExists) {
      throw new CustomError(`El email ${data.email} ya está en uso.`, 409);
    }

    const foundWithNationalIdAndRole =
      await this.userRepository.findByNationalIdAndRole(
        data.nationalId,
        Roles.PATIENT
      );

    if (foundWithNationalIdAndRole) {
      throw new CustomError(
        `El DNI ${data.nationalId} está en uso por otro usuario con el rol
      ${foundWithNationalIdAndRole.role}.`,
        409
      );
    }

    const patientHealthInsurances = await Promise.all(
      (data.healthInsurances || []).map(async (insurance) => {
        const insuranceFound = await this.healthInsuranceRepository.findById(
          insurance.insuranceId
        );

        if (!insuranceFound) {
          throw new CustomError(
            `La obra social (ID: ${insurance.insuranceId}) no existe`,
            404
          );
        }

        const isDuplicate = await this.patientRepository.existsMemberNumber(
          insurance.insuranceId,
          insurance.memberNumber
        );

        if (isDuplicate) {
          throw new CustomError(
            `El número de afiliado ${insurance.memberNumber} ya está registrado
            para ${insuranceFound.name}`,
            409
          );
        }

        return new PatientHealthInsurance(
          insuranceFound,
          insurance.memberNumber
        );
      })
    );

    const patient = new Patient({
      id: 0,
      role: Roles.PATIENT,
      passwordHash: data.password,
      ...data,
      nationalIdImageUrl: data.nationalIdImageUrl,
      healthInsurances: patientHealthInsurances,
    });

    await this.patientRepository.register(patient);
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
