/**
 * Theme Controller UI Logic
 * Uses shared ThemeConfig for all theme-related constants and utilities
 */

// Get shared configuration from global scope
const config = window.ThemeConfig;

// Re-export constants for convenience (optional, but makes code cleaner)
const { THEME_KEY, THEME_LIGHT, THEME_SYSTEM, ICONS } = config;

/**
 * Update the UI (Dropdown button icon/text and radio buttons)
 * @param {string} selectedPreference - The user's preference (light, dark, or system)
 * @param {string} _appliedTheme - The actual theme being applied (unused, kept for API compatibility)
 */
function updateUI(selectedPreference, _appliedTheme) {
  // Determine which icon to show
  const iconName = ICONS[selectedPreference];

  // Update both navbar and sidebar icon containers
  const iconContainers = [
    document.getElementById("theme-current-icon"),
    document.getElementById("theme-current-icon-sidebar"),
  ];

  iconContainers.forEach((iconContainer) => {
    if (iconContainer) {
      // Replace content with a fresh icon element
      iconContainer.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i>`;

      // Re-render lucide icons for this specific container
      if (window.lucide) {
        // eslint-disable-next-line no-undef
        lucide.createIcons({
          root: iconContainer,
          nameAttr: "data-lucide",
          attrs: {
            class: "w-4 h-4",
          },
        });
      }
    }
  });

  // Update Radio Buttons in both navbar and sidebar
  const radios = document.querySelectorAll(
    'input[name="theme-dropdown"], input[name="theme-dropdown-sidebar"]'
  );
  radios.forEach((radio) => {
    if (radio.value === selectedPreference) {
      radio.checked = true;
    }
  });
}

/**
 * Initialize the theme controller
 */
export function initThemeController() {
  const savedPreference = localStorage.getItem(THEME_KEY) || THEME_LIGHT; // Default to light if not set (AC1)

  let themeToApply = savedPreference;
  if (savedPreference === THEME_SYSTEM) {
    themeToApply = config.getSystemTheme();
  }

  // Theme is already applied by the inline script in <head>
  // We only need to update UI and setup listeners

  const onReady = () => {
    updateUI(savedPreference, themeToApply);
    setupEventListeners();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  // Listen for system changes if preference is system
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (config.getSavedPreference() === THEME_SYSTEM) {
        const newSystemTheme = config.getSystemTheme();
        config.applyTheme(newSystemTheme);
        // No UI update needed as icon remains "system"
      }
    });
}

/**
 * Setup event listeners for theme selection
 */
function setupEventListeners() {
  // Select both navbar and sidebar theme radio buttons
  const radios = document.querySelectorAll(
    'input[name="theme-dropdown"], input[name="theme-dropdown-sidebar"]'
  );

  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const selectedPreference = e.target.value;

      // Save preference
      config.savePreference(selectedPreference);

      const themeToApply = config.resolveTheme(selectedPreference);

      // Apply immediately
      config.applyTheme(themeToApply);

      // Update both navbar and sidebar UI
      updateUI(selectedPreference, themeToApply);
    });
  });
}
