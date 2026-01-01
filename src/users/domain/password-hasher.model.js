/**
 * @typedef {object} PasswordHasher
 * @property {function(string): Promise<string>} hash
 * Hash a password.
 * @property {function(string, string): Promise<boolean>} compare
 * Compare a password with a hash.
 */
