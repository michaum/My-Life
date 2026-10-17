/** My Life V2 — shared theme preference controller (STEP 18F.8E.1).
 * Dormant until explicitly wired to the app in a later approved step.
 * Never touches the existing wallpaper preference.
 */
export type MyLifeThemePreference = "light" | "dark" | "system";
export type MyLifeResolvedTheme = "light" | "dark";

export const MY_LIFE_THEME_STORAGE_KEY = "my-life-v2-theme-preference";
export const MY_LIFE_THEME_CHANGE_EVENT = "my-life-v2-theme-change";

export function isMyLifeThemePreference(value: unknown): value is MyLifeThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Existing users remain on the approved light appearance by default. */
export function readMyLifeThemePreference(): MyLifeThemePreference {
  if (typeof window === "undefined") return "light";
  try {
    const stored: unknown = window.localStorage.getItem(MY_LIFE_THEME_STORAGE_KEY);
    if (stored === "system") {
      const resolved = resolveMyLifeTheme("system");
      window.localStorage.setItem(MY_LIFE_THEME_STORAGE_KEY, resolved);
      return resolved;
    }
    return isMyLifeThemePreference(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

export function resolveMyLifeTheme(preference: MyLifeThemePreference): MyLifeResolvedTheme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Set only the My Life theme attributes; do not alter shadcn's .dark or other app classes. */
export function applyMyLifeTheme(preference: MyLifeThemePreference): MyLifeResolvedTheme {
  const resolved = resolveMyLifeTheme(preference);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.mlTheme = resolved;
    document.documentElement.dataset.mlThemePreference = preference;
  }
  return resolved;
}

/** Persist preference only on an explicit user choice. */
export function saveMyLifeThemePreference(preference: MyLifeThemePreference): MyLifeResolvedTheme {
  if (!isMyLifeThemePreference(preference)) throw new Error("Invalid My Life theme preference");
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(MY_LIFE_THEME_STORAGE_KEY, preference); } catch { /* storage unavailable */ }
  }
  const resolved = applyMyLifeTheme(preference);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MY_LIFE_THEME_CHANGE_EVENT));
  return resolved;
}

/** Call when mounting the future theme provider; returns a cleanup function. */
export function initializeMyLifeTheme(): () => void {
  if (typeof window === "undefined") return () => {};
  const sync = () => { applyMyLifeTheme(readMyLifeThemePreference()); };
  sync();
  const media = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  media?.addEventListener("change", sync);
  window.addEventListener("storage", sync);
  window.addEventListener(MY_LIFE_THEME_CHANGE_EVENT, sync);
  return () => {
    media?.removeEventListener("change", sync);
    window.removeEventListener("storage", sync);
    window.removeEventListener(MY_LIFE_THEME_CHANGE_EVENT, sync);
  };
}
