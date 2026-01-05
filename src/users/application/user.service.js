/**
 * @typedef {import("../domain/user.repository.js").UserRepository} UserRepository
 * @typedef {import("../domain/password-hasher.model.js").PasswordHasher} PasswordHasher
 */

import { ok, err } from "neverthrow";
import { User } from "../domain/user.model.js";
import {
  EmailAlreadyInUseError,
  NationalIdAlreadyInUseError,
  UserNotFoundError,
} from "../domain/user.errors.js";

export class UserService {
  /**
   * @param {UserRepository} userRepository
   * @param {PasswordHasher} passwordHasher
   */
  constructor(userRepository, passwordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  /**
   * @param {import("../infrastructure/user.schemas.js").BaseUserRegistrationDTO} data
   * @returns {Promise<import("neverthrow").Result<
   *   void,
   *   EmailAlreadyInUseError |
   *   NationalIdAlreadyInUseError>
   * >}
   * Returns void when the user is successfully registered.
   * Returns specific errors when something goes wrong:
   * - `EmailAlreadyInUseError` The user already exists.
   * - `NationalIdAlreadyInUseError` The user already exists with the same
   *   national ID and role.
   */
  async register(data) {
    const userExists = await this.userRepository.findByEmail(data.email);

    if (userExists) {
      return err(new EmailAlreadyInUseError(data.email));
    }

    const foundWithNationalIdAndRole =
      await this.userRepository.findByNationalIdAndRole(
        data.nationalId,
        data.role
      );

    if (foundWithNationalIdAndRole) {
      return err(
        new NationalIdAlreadyInUseError(
          data.nationalId,
          foundWithNationalIdAndRole.role
        )
      );
    }

    const hashedPassword = await this.passwordHasher.hash(data.password);

    const user = new User({
      id: 0,
      passwordHash: hashedPassword,
      ...data,
    });

    await this.userRepository.register(user);
    return ok(undefined);
  }

  /**
   * List all users.
   * @returns {Promise<User[]>} All users. If no users are found, an empty
   * array is returned.
   */
  async listAll() {
    return this.userRepository.findAll();
  }

  /**
   * Get a user profile.
   * @param {number} id User ID.
   * @returns {Promise<import("neverthrow").Result<User, UserNotFoundError>>} User profile.
   */
  async getProfile(id) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return err(new UserNotFoundError(id));
    }

    return ok(user);
  }
}
