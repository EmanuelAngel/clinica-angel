/**
 * @typedef {import("../domain/user.repository.js").UserRepository} UserRepository
 * @typedef {import("../domain/password-hasher.model.js").PasswordHasher} PasswordHasher
 */

import { CustomError } from "../../_shared/domain/custom-error.js";
import { User } from "../domain/user.model.js";

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
   */
  async register(data) {
    const userExists = await this.userRepository.findByEmail(data.email);

    if (userExists) {
      throw new CustomError(`El email ${data.email} ya está en uso.`, 409);
    }

    const foundWithNationalIdAndRole =
      await this.userRepository.findByNationalIdAndRole(
        data.nationalId,
        data.role
      );

    if (foundWithNationalIdAndRole) {
      throw new CustomError(
        `El DNI ${data.nationalId} está en uso por otro usuario con el rol
        ${foundWithNationalIdAndRole.role}.`,
        409
      );
    }

    const hashedPassword = await this.passwordHasher.hash(data.password);

    const user = new User({
      id: 0,
      passwordHash: hashedPassword,
      ...data,
    });

    await this.userRepository.register(user);
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
   * @returns {Promise<User>} User profile.
   */
  async getProfile(id) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new CustomError(`El usuario que solicita no existe.`, 404);
    }

    return user;
  }
}
