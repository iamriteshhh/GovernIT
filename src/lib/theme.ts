export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "governit-theme";

/** Saved choice wins; otherwise follow the system preference. */
export function resolveTheme(stored: string | null | undefined, systemPrefersDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Mirrors resolveTheme(); kept tiny and dependency-free.
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");}catch(e){}var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);})();`;
