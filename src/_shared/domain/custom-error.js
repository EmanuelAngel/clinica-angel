export class CustomError extends Error {
  /**
   * @param {string} message - Error message. Defaults to 'Algo salió mal.'.
   * Client will see message errors when status code is 4xx.
   * @param {number} statusCode - HTTP status code. Defaults to 500.
   */
  constructor(message = "Algo salió mal.", statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
