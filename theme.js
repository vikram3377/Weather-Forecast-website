const THEME_STORAGE_KEY = "skycast-theme";
const THEME_ICONS = {
  light: "☀️",
  dark: "🌙",
};

const toggleButton = document.querySelector("[data-theme-toggle]");

const getPreferredTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  if (toggleButton) {
    const label = toggleButton.querySelector(".theme-toggle__label");
    const icon = toggleButton.querySelector(".theme-toggle__icon");
    toggleButton.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    if (label) {
      label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    }
    if (icon) {
      icon.textContent = theme === "dark" ? THEME_ICONS.light : THEME_ICONS.dark;
    }
  }
};

const currentTheme = getPreferredTheme();
applyTheme(currentTheme);

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
}

