export class Location {
  /**
   * @param {object} props
   * @param {number} props.id
   * @param {string} props.name
   * @param {string} props.address
   * @param {string | null} [props.phone]
   * @param {Date | null} [props.deletedAt]
   */
  constructor({ id, name, address, phone = null, deletedAt = null }) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.deletedAt = deletedAt;
  }
}
