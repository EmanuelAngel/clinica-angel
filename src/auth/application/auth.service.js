import { ok, err } from "neverthrow";
import { InvalidCredentialsError } from "../domain/auth.errors.js";

export class AuthService {
  /**
   * @param {import("../../users/domain/user.repository.js").UserRepository} userRepository
   * @param {import("../../users/domain/password-hasher.model.js").PasswordHasher} passwordHasher
   */
  constructor(userRepository, passwordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  /**
   * Authenticate a user.
   * @param {import("../infrastructure/auth.schemas.js").LoginDTO} data User credentials.
   * @returns {Promise<import("neverthrow").Result<import("../../users/domain/user.model.js").User, InvalidCredentialsError>>}
   * Authenticated user.
   */
  async authenticate({ email, password }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return err(new InvalidCredentialsError());
    }

    const credentialsMatch = await this.passwordHasher.compare(
      password,
      user.passwordHash
    );

    if (!credentialsMatch) {
      return err(new InvalidCredentialsError());
    }

    return ok(user);
  }
}
