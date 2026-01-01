import bcrypt from "bcrypt";

/**
 * @typedef {import("../domain/password-hasher.model.js").PasswordHasher} PasswordHasher
 */

/**
 * @implements {PasswordHasher}
 */
export class BcryptPasswordHasher {
  /**
   * @param {number} saltRounds The number of rounds for the salt.
   * Defaults to 10. Higher values increase security but also increase
   * computation time.
   */
  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * @param {string} password
   * @returns {Promise<string>} The hashed password.
   */
  async hash(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>} `true` if the password matches the hash,
   * `false` otherwise.
   */
  async compare(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}
