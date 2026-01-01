import { CustomError } from "../../_shared/domain/custom-error.js";

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
   * @returns {Promise<import("../../users/domain/user.model.js").User>}
   * Authenticated user.
   */
  async authenticate({ email, password }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new CustomError("El email y/o la contraseña son incorrectos.", 401);
    }

    const credentialsMatch = await this.passwordHasher.compare(
      password,
      user.passwordHash
    );

    if (!credentialsMatch) {
      throw new CustomError("El email y/o la contraseña son incorrectos.", 401);
    }

    return user;
  }
}
