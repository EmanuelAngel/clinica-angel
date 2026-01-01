/**
 * @typedef {object} UserProps
 * @property {number} id The user unique identifier.
 * @property {string} email The user email.
 * @property {string} passwordHash The user password hash.
 * @property {import("../../auth/domain/roles.js").Roles} role The user role.
 * @property {string} firstNames The user first names.
 * @property {string} lastNames The user last names.
 * @property {string} nationalId The user national ID. Such as DNI, NIE, etc.
 * @property {string} phone The user phone number.
 * @property {string} address The user address.
 * @property {Date} [registeredAt] The user registration date.
 * @property {Date|null} [deletedAt] The user last deactivation date.
 */

export class User {
  /**
   * @param {UserProps} props
   */
  constructor({
    id,
    email,
    passwordHash,
    role,
    firstNames,
    lastNames,
    nationalId,
    phone,
    address,
    registeredAt,
    deletedAt,
  }) {
    this.id = id;
    this.email = email;
    // Make passwordHash non-enumerable to prevent accidental exposure
    Object.defineProperty(this, "passwordHash", {
      value: passwordHash,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    this.role = role;
    this.firstNames = firstNames;
    this.lastNames = lastNames;
    this.nationalId = nationalId;
    this.phone = phone;
    this.address = address;
    this.registeredAt = registeredAt || new Date();
    this.deletedAt = deletedAt || null;
  }

  /**
   * Checks if the user is active.
   * @returns {boolean} `true` if the user is active, `false` otherwise.
   */
  isActive() {
    return this.deletedAt === null;
  }

  /**
   * Returns the user's full name.
   * @returns {string} The user's full name.
   * @example
   * const user = new User(..., "John", "Doe", ...);
   * console.log(user.fullName); // "John Doe"
   */
  get fullName() {
    return `${this.firstNames} ${this.lastNames}`;
  }

  /**
   * Returns a safe representation of the user without the password hash.
   * Useful for JSON serialization and external API responses.
   * @returns {object} A plain object with all user properties except passwordHash.
   */
  toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      firstNames: this.firstNames,
      lastNames: this.lastNames,
      nationalId: this.nationalId,
      phone: this.phone,
      address: this.address,
      registeredAt: this.registeredAt,
      deletedAt: this.deletedAt,
    };
  }

  /**
   * Custom JSON serialization that excludes the password hash.
   * This is automatically called by JSON.stringify().
   * @returns {object} A safe representation of the user.
   */
  toJSON() {
    return this.toSafeObject();
  }
}
