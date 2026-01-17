/**
 * Theme Configuration - Shared between inline script and module
 * This file is loaded as a regular script (not ES module) so it's available globally
 */

// Make configuration available globally
window.ThemeConfig = (function () {
  "use strict";

  // Theme Constants
  const THEME_KEY = "theme-preference";
  const THEME_LIGHT = "clinic-light";
  const THEME_DARK = "clinic-dark";
  const THEME_SYSTEM = "system";

  // Future: Add high contrast themes
  // const THEME_LIGHT_HC = 'clinic-light-hc';
  // const THEME_DARK_HC = 'clinic-dark-hc';

  // Icon mapping for each theme
  const ICONS = {
    [THEME_LIGHT]: "sun",
    [THEME_DARK]: "moon",
    [THEME_SYSTEM]: "monitor",
    // Future: Add high contrast icons
    // [THEME_LIGHT_HC]: 'sun',
    // [THEME_DARK_HC]: 'moon',
  };

  // Theme groups (for determining base theme from variants)
  const LIGHT_THEMES = [THEME_LIGHT]; // Future: Add THEME_LIGHT_HC
  const DARK_THEMES = [THEME_DARK]; // Future: Add THEME_DARK_HC

  /**
   * Get the current system theme preference
   * @returns {string} THEME_LIGHT or THEME_DARK
   */
  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? THEME_DARK
      : THEME_LIGHT;
  }

  /**
   * Resolve the actual theme to apply based on user preference
   * @param {string} preference - User's theme preference
   * @returns {string} The actual theme to apply
   */
  function resolveTheme(preference) {
    if (preference === THEME_SYSTEM) {
      return getSystemTheme();
    }
    return preference;
  }

  /**
   * Apply theme to the document
   * @param {string} theme - Theme to apply
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  /**
   * Get saved theme preference from localStorage
   * @returns {string} Saved preference or default (THEME_LIGHT)
   */
  function getSavedPreference() {
    return localStorage.getItem(THEME_KEY) || THEME_LIGHT;
  }

  /**
   * Save theme preference to localStorage
   * @param {string} preference - Theme preference to save
   */
  function savePreference(preference) {
    localStorage.setItem(THEME_KEY, preference);
  }

  /**
   * Check if a theme is a light variant
   * @param {string} theme - Theme to check
   * @returns {boolean}
   */
  function isLightTheme(theme) {
    return LIGHT_THEMES.includes(theme);
  }

  /**
   * Check if a theme is a dark variant
   * @param {string} theme - Theme to check
   * @returns {boolean}
   */
  function isDarkTheme(theme) {
    return DARK_THEMES.includes(theme);
  }

  // Public API
  return {
    // Constants
    THEME_KEY,
    THEME_LIGHT,
    THEME_DARK,
    THEME_SYSTEM,
    ICONS,
    LIGHT_THEMES,
    DARK_THEMES,

    // Functions
    getSystemTheme,
    resolveTheme,
    applyTheme,
    getSavedPreference,
    savePreference,
    isLightTheme,
    isDarkTheme,
  };
})();
