import nunjucks from "nunjucks";

/**
 * Registers all custom Nunjucks filters on the given environment.
 * @param {import("nunjucks").Environment} njkEnv
 */
export function registerNunjucksFilters(njkEnv) {
  /**
   * Serializes a value as JSON that is safe to embed inside a `<script>` block.
   *
   * Nunjucks' built-in `dump` is `JSON.stringify` and does not escape the
   * `</script>` sequence, so pairing it with `safe` lets a stored or re-rendered
   * value close the block and inject markup (JSON-in-HTML injection). This
   * filter escapes every character that can close or comment the block and
   * returns a `SafeString`, so templates use `{{ value | json }}` and never need
   * `safe`.
   * @param {unknown} value Value to serialize.
   * @returns {import("nunjucks").runtime.SafeString} Escaped JSON literal.
   */
  njkEnv.addFilter("json", (value) => {
    const json = JSON.stringify(value ?? null, null, 2) ?? "null";

    const escaped = json
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

    return new nunjucks.runtime.SafeString(escaped);
  });

  /**
   * Formats a date value into a string using the given format.
   * @param {Date | string | null | undefined} date
   * @param {"DD/MM/YYYY" | "yyyy-MM-dd" | "EEEE, d MMMM yyyy" | "H" | "m"} [format="DD/MM/YYYY"]
   * @param {string} [locale="es"]
   * @returns {string}
   */
  njkEnv.addFilter("date", (date, format = "DD/MM/YYYY", locale = "es") => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    if (format === "DD/MM/YYYY") return `${day}/${month}/${year}`;
    if (format === "yyyy-MM-dd") return `${year}-${month}-${day}`;
    if (format === "EEEE, d MMMM yyyy") {
      return d.toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (format === "H") return d.getHours().toString();
    if (format === "m") return d.getMinutes().toString();

    return d.toLocaleDateString();
  });

  /**
   * Adds a given amount of time units to a date.
   * @param {Date | string | null | undefined} date
   * @param {number} amount
   * @param {"days" | "months" | "years"} unit
   * @returns {Date}
   */
  njkEnv.addFilter("dateAdd", (date, amount, unit) => {
    if (!date) return new Date();
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date();

    if (unit === "days") {
      d.setDate(d.getDate() + amount);
    } else if (unit === "months") {
      d.setMonth(d.getMonth() + amount);
    } else if (unit === "years") {
      d.setFullYear(d.getFullYear() + amount);
    }

    return d;
  });

  /**
   * Left-pads a value with a character up to the given length.
   * @param {string | number} value
   * @param {number} length
   * @param {string} [char="0"]
   * @returns {string}
   */
  njkEnv.addFilter("padStart", (value, length, char = "0") => {
    return String(value).padStart(length, char);
  });

  /**
   * Converts a string to uppercase.
   * @param {string | null | undefined} value
   * @returns {string}
   */
  njkEnv.addFilter("upper", (value) => {
    if (!value) return "";
    return String(value).toUpperCase();
  });

  /**
   * Formats a date as HH:mm time string.
   * @param {Date | string | null | undefined} date
   * @returns {string}
   */
  njkEnv.addFilter("time", (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  });
}
