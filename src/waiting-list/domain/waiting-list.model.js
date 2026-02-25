/**
 * @typedef {object} WaitingListEntryProps
 * @property {number} id
 * @property {number} patientId
 * @property {number | null} professionalId
 * @property {number | null} specialtyId
 * @property {Date} requestDate
 * @property {string} patientName
 * @property {string} patientDni
 * @property {string} patientPhone
 * @property {string} patientEmail
 * @property {string | null} professionalName
 * @property {string | null} specialtyName
 */

export class WaitingListEntry {
  /**
   * @param {WaitingListEntryProps} props
   */
  constructor(props) {
    this.id = props.id;
    this.patientId = props.patientId;
    this.professionalId = props.professionalId;
    this.specialtyId = props.specialtyId;
    this.requestDate = props.requestDate;
    this.patientName = props.patientName;
    this.patientDni = props.patientDni;
    this.patientPhone = props.patientPhone;
    this.patientEmail = props.patientEmail;
    this.professionalName = props.professionalName;
    this.specialtyName = props.specialtyName;
  }
}
