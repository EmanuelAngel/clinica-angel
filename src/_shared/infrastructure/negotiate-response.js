/**
 * Determines whether to respond with JSON or HTML based on the request.
 * @param {import("express").Request} req
 * @returns {"json" | "html"} The response format to use.
 */
export function negotiateResponse(req) {
  if (req.path.startsWith("/api")) {
    return "json";
  }

  return "html";
}
