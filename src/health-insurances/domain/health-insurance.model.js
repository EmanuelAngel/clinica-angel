export class HealthInsurance {
  /**
   * Represents a health insurance. Such as OSEP, Swiss Medical, etc.
   * @param {number} id
   * @param {string} name
   * @param {Date | null} deletedAt
   */
  constructor(id, name, deletedAt) {
    this.id = id;
    this.name = name;
    this.deletedAt = deletedAt;
  }
}
