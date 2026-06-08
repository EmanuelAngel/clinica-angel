import nunjucks from "nunjucks";
import { registerNunjucksFilters } from "./nunjucks-filters.js";

/** @type {nunjucks.Environment} */
let njkEnv;

beforeAll(() => {
  njkEnv = new nunjucks.Environment();
  registerNunjucksFilters(njkEnv);
});

/**
 * Helper: renders a filter inline via a nunjucks template string.
 * @param {string} expression  e.g. `myVar | date`
 * @param {object} [context]
 * @returns {string}
 */
function render(expression, context = {}) {
  return njkEnv.renderString(`{{ ${expression} }}`, context);
}

describe("date filter", () => {
  // Use numeric constructor — always local time, no timezone shift
  const date = new Date(2024, 2, 15); // March 15, 2024

  test("defaults to DD/MM/YYYY", () => {
    expect(render("d | date", { d: date })).toBe("15/03/2024");
  });

  test("formats as yyyy-MM-dd", () => {
    expect(render("d | date('yyyy-MM-dd')", { d: date })).toBe("2024-03-15");
  });

  test("returns empty string for null", () => {
    expect(render("d | date", { d: null })).toBe("");
  });

  test("returns empty string for undefined", () => {
    expect(render("d | date", {})).toBe("");
  });

  test("returns original value for invalid date", () => {
    expect(render("d | date", { d: "not-a-date" })).toBe("not-a-date");
  });

  test("format H returns hour as string", () => {
    const noon = new Date("2024-03-15T12:30:00");
    expect(render("d | date('H')", { d: noon })).toBe(String(noon.getHours()));
  });

  test("format m returns minutes as string", () => {
    const time = new Date("2024-03-15T12:45:00");
    expect(render("d | date('m')", { d: time })).toBe(
      String(time.getMinutes())
    );
  });
});

describe("dateAdd filter", () => {
  const base = new Date(2024, 0, 15); // January 15, 2024

  test("adds days", () => {
    const result = njkEnv.renderString("{{ d | dateAdd(5, 'days') | date }}", {
      d: base,
    });
    expect(result).toBe("20/01/2024");
  });

  test("adds months", () => {
    const result = njkEnv.renderString(
      "{{ d | dateAdd(2, 'months') | date }}",
      { d: base }
    );
    expect(result).toBe("15/03/2024");
  });

  test("adds years", () => {
    const result = njkEnv.renderString("{{ d | dateAdd(1, 'years') | date }}", {
      d: base,
    });
    expect(result).toBe("15/01/2025");
  });

  test("returns current date for null input", () => {
    // Just check it returns a Date-like string, not empty/error
    const result = njkEnv.renderString("{{ d | dateAdd(1, 'days') | date }}", {
      d: null,
    });
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("padStart filter", () => {
  test("pads a number with zeros", () => {
    expect(render("n | padStart(3)", { n: 5 })).toBe("005");
  });

  test("pads a string with zeros", () => {
    expect(render("s | padStart(4)", { s: "42" })).toBe("0042");
  });

  test("does not truncate if already long enough", () => {
    expect(render("n | padStart(2)", { n: 123 })).toBe("123");
  });

  test("uses custom character", () => {
    expect(render("n | padStart(4, ' ')", { n: 7 })).toBe("   7");
  });
});

describe("upper filter", () => {
  test("converts string to uppercase", () => {
    expect(render("s | upper", { s: "hello" })).toBe("HELLO");
  });

  test("returns empty string for null", () => {
    expect(render("s | upper", { s: null })).toBe("");
  });

  test("returns empty string for undefined", () => {
    expect(render("s | upper", {})).toBe("");
  });
});

describe("time filter", () => {
  test("formats time as HH:mm", () => {
    const date = new Date("2024-03-15T09:05:00");
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    expect(render("d | time", { d: date })).toBe(`${h}:${m}`);
  });

  test("returns empty string for null", () => {
    expect(render("d | time", { d: null })).toBe("");
  });

  test("returns original value for invalid date", () => {
    expect(render("d | time", { d: "invalid" })).toBe("invalid");
  });
});
