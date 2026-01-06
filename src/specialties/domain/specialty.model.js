export class Specialty {
  /**
   * Represents a medical specialty.
   * @param {number} id
   * @param {string} name
   * @param {Date | null} deletedAt
   */
  constructor(id, name, deletedAt = null) {
    this.id = id;
    this.name = name;
    this.deletedAt = deletedAt;
  }

  /**
   * Check if the specialty is active.
   * @returns {boolean}
   */
  get isActive() {
    return this.deletedAt === null;
  }
}
