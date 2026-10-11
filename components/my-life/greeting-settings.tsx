"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TimeFormat = "12" | "24";
type TemperatureUnit = "C" | "F";
type LocationMode = "manual" | "auto";

const PREFIX = "my-life-greeting-";
const FORMAT_KEY = PREFIX + "time-format";
const UNIT_KEY = PREFIX + "temperature-unit";
const MODE_KEY = PREFIX + "location-mode";
const CITY_KEY = PREFIX + "weather-city";
const BACKGROUND_KEY = PREFIX + "dynamic-background";

/* CM.7Q.7I.21D.2B - One panel for clock and weather preferences */
export function MyLifeGreetingSettings() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<TimeFormat>("12");
  const [unit, setUnit] = useState<TemperatureUnit>("C");
  const [mode, setMode] = useState<LocationMode>("manual");
  const [city, setCity] = useState("");
  const [background, setBackground] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    try {
      setFormat(
        window.localStorage.getItem(FORMAT_KEY) === "24" ? "24" : "12"
      );
      setUnit(
        window.localStorage.getItem(UNIT_KEY) === "F" ? "F" : "C"
      );
      setMode(
        window.localStorage.getItem(MODE_KEY) === "auto"
          ? "auto"
          : "manual"
      );
      setCity(window.localStorage.getItem(CITY_KEY) ?? "");
      setBackground(
        window.localStorage.getItem(BACKGROUND_KEY) !== "false"
      );
    } catch {
      // Preferences remain usable during this session.
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const panelWidth = Math.min(310, window.innerWidth - 24);
      const left = Math.max(
        12,
        Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 12)
      );

      setPanelPosition({
        top: rect.bottom + 7,
        right: window.innerWidth - left - panelWidth,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const save = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
      window.dispatchEvent(new Event("my-life-greeting-preferences-change"));
    } catch {
      // Keep the selection active in the current session.
    }
  };

  const changeFormat = (value: TimeFormat) => {
    setFormat(value);
    save(FORMAT_KEY, value);
    window.dispatchEvent(
      new Event("my-life-greeting-time-format-change")
    );
  };

  const fieldStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    cursor: "pointer",
  } as const;

  return (
    <div
      ref={containerRef}
      className="ml-v2-greeting-settings"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: open ? 50 : 2,
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Greeting card settings"
        aria-expanded={open}
        aria-controls="ml-v2-greeting-settings-panel"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          borderRadius: 9,
          border: "1px solid rgba(113,105,152,.24)",
          background: "rgba(255,255,255,.85)",
          color: "#6652a5",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ⚙
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          id="ml-v2-greeting-settings-panel"
          role="region"
          aria-label="Greeting card preferences"
          style={{
            position: "fixed",
            right: panelPosition.right,
            top: panelPosition.top,
            zIndex: 2147483000,
            width: "min(310px, calc(100vw - 44px))",
            maxHeight: "min(70vh, 480px)",
            overflowY: "auto",
            padding: 16,
            borderRadius: 14,
            border: "1px solid #dcd9e8",
            background: "#ffffff",
            color: "#273044",
            boxShadow: "0 12px 36px rgba(31,35,55,.2)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <strong style={{ fontSize: 15 }}>
              Greeting Card Settings
            </strong>
            <button
              type="button"
              aria-label="Close greeting settings"
              onClick={() => setOpen(false)}
              style={{
                border: 0,
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>
              Time format
            </legend>
            <label style={fieldStyle}>
              <input
                type="radio"
                name="ml-greeting-time-format"
                checked={format === "12"}
                onChange={() => changeFormat("12")}
              />
              12-hour (AM/PM)
            </label>
            <label style={fieldStyle}>
              <input
                type="radio"
                name="ml-greeting-time-format"
                checked={format === "24"}
                onChange={() => changeFormat("24")}
              />
              24-hour
            </label>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>
              Temperature
            </legend>
            <label style={fieldStyle}>
              <input
                type="radio"
                name="ml-greeting-temperature"
                checked={unit === "C"}
                onChange={() => {
                  setUnit("C");
                  save(UNIT_KEY, "C");
                }}
              />
              Celsius (°C)
            </label>
            <label style={fieldStyle}>
              <input
                type="radio"
                name="ml-greeting-temperature"
                checked={unit === "F"}
                onChange={() => {
                  setUnit("F");
                  save(UNIT_KEY, "F");
                }}
              />
              Fahrenheit (°F)
            </label>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>
              Weather location
            </legend>
            <label style={fieldStyle}>
              <input
                type="radio"
                name="ml-greeting-location"
                checked={mode === "manual"}
                onChange={() => {
                  setMode("manual");
                  save(MODE_KEY, "manual");
                }}
              />
              Choose a city
            </label>
            <label style={fieldStyle}>
              <input
                type="radio"
                name="ml-greeting-location"
                checked={mode === "auto"}
                onChange={() => {
                  setMode("auto");
                  save(MODE_KEY, "auto");
                }}
              />
              Automatic location
            </label>
            {mode === "manual" && (
              <input
                type="text"
                aria-label="Weather city"
                placeholder="City, province or country"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  save(CITY_KEY, event.target.value);
                }}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: 8,
                  padding: 8,
                  border: "1px solid #d5d7e2",
                  borderRadius: 7,
                }}
              />
            )}
          </fieldset>

          <label style={{ ...fieldStyle, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={background}
              onChange={(event) => {
                setBackground(event.target.checked);
                save(
                  BACKGROUND_KEY,
                  String(event.target.checked)
                );
              }}
            />
            Dynamic weather background
          </label>

        </div>
      , document.body)}
    </div>
  );
}
