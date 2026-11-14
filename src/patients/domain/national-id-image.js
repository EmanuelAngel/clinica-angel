/**
 * Allowed content types for the national ID image uploaded during patient
 * registration, mapped to the extension used to store it on disk.
 *
 * This table is the single source of truth for the accepted input: the zod
 * schema, the multipart upload filter and the route that serves the stored
 * file all derive their policy from it, so inbound and outbound rules cannot
 * drift apart.
 * @type {Readonly<Record<string, string>>}
 */
export const NATIONAL_ID_IMAGE_EXTENSIONS = Object.freeze({
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
});

/**
 * Content types accepted for the national ID image.
 * @type {readonly string[]}
 */
export const NATIONAL_ID_IMAGE_MIME_TYPES = Object.freeze(
  Object.keys(NATIONAL_ID_IMAGE_EXTENSIONS)
);

/**
 * Content types the application may serve for a stored national ID image,
 * keyed by file extension. The response header always comes from this table,
 * never from anything the client sent.
 * @type {Readonly<Record<string, string>>}
 */
export const NATIONAL_ID_IMAGE_CONTENT_TYPES = Object.freeze(
  Object.entries(NATIONAL_ID_IMAGE_EXTENSIONS).reduce(
    /**
     * @param {Record<string, string>} table
     * @param {[string, string]} entry
     * @returns {Record<string, string>} Table with the extension registered.
     */
    (table, [mimeType, extension]) => {
      table[extension] ??= mimeType;

      return table;
    },
    {}
  )
);

/**
 * Maximum accepted size for the national ID image, in bytes.
 * @type {number}
 */
export const NATIONAL_ID_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
