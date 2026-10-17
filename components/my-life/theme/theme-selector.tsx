"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import {
  initializeMyLifeTheme,
  readMyLifeThemePreference,
  saveMyLifeThemePreference,
  type MyLifeThemePreference,
} from "./theme-controller";
import "./theme-selector.css";

/** Independent control: does not modify the wallpaper or existing app state. */
export function MyLifeThemeSelector() {
  const [preference, setPreference] = useState<MyLifeThemePreference>("light");
  useEffect(() => {
    setPreference(readMyLifeThemePreference());
    return initializeMyLifeTheme();
  }, []);
  const change = (value: string) => {
    if (value !== "light" && value !== "dark") return;
    setPreference(value);
    saveMyLifeThemePreference(value);
  };
  return (
    <label className="ml-theme-choice">
      <span className="ml-v2-nav-icon ml-theme-choice__icon" aria-hidden="true"><Palette size={17} /></span>
      <span className="ml-v2-nav-text ml-theme-choice__label">Appearance</span>
      <select
        aria-label="Appearance theme"
        value={preference}
        onChange={(event) => change(event.target.value)}
      >
        <option value="light">☀ Light</option>
        <option value="dark">☾ Dark</option>
      </select>
    </label>
  );
}
