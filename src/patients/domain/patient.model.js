import { CustomError } from "../../_shared/domain/custom-error.js";
import { User } from "../../users/domain/user.model.js";

/**
 * @typedef {import("../../users/domain/user.model.js").UserProps} UserProps
 * @typedef {object} PatientSpecificProps
 * @property {string} nationalIdImageUrl - The patient national ID image URL.
 * @property {PatientHealthInsurance[]} [healthInsurances] - The patient health insurances.
 * @typedef {UserProps & PatientSpecificProps} PatientProps
 */

/**
 * @augments User
 */
export class Patient extends User {
  /**
   * @param {PatientProps} props
   */
  constructor({ nationalIdImageUrl, healthInsurances = [], ...userProps }) {
    super(userProps);

    this.ensureHasNationalIdImageUrl(nationalIdImageUrl);

    this.nationalIdImageUrl = nationalIdImageUrl;
    this.healthInsurances = healthInsurances;
  }

  /**
   * Ensures the image url is defined.
   * @param {string} imageUrl
   */
  ensureHasNationalIdImageUrl(imageUrl) {
    if (!imageUrl) {
      throw new CustomError(
        `El Paciente con el email ${this.email} no tiene imagen de DNI asociada.`,
        422
      );
    }
  }
}

export class PatientHealthInsurance {
  /**
   * @param {import("../../health-insurances/domain/health-insurance.model.js").HealthInsurance} insurance
   * @param {string} memberNumber
   */
  constructor(insurance, memberNumber) {
    /** @type {number} */
    this.insuranceId = insurance.id;
    /** @type {string} */
    this.insuranceName = insurance.name;
    /** @type {string} */
    this.memberNumber = memberNumber;
  }
}
