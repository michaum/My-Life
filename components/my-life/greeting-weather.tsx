"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchGreetingWeather,
  findGreetingWeatherLocations,
  formatGreetingTemperature,
  type GreetingWeather,
} from "./greeting-weather-data";

const PREFIX = "my-life-greeting-";
const CHANGE_EVENT = "my-life-greeting-preferences-change";

type WeatherPreferences = {
  city: string;
  mode: "manual" | "auto";
  unit: "C" | "F";
};

function readPreferences(): WeatherPreferences {
  try {
    const storage = window.localStorage;
    return {
      city: storage.getItem(PREFIX + "weather-city")?.trim() ?? "",
      mode: storage.getItem(PREFIX + "location-mode") === "auto"
        ? "auto"
        : "manual",
      unit: storage.getItem(PREFIX + "temperature-unit") === "F"
        ? "F"
        : "C",
    };
  } catch {
    return { city: "", mode: "manual", unit: "C" };
  }
}


/* CM.7Q.7I.21E.5A - Home greeting card weather themes only */
function greetingWeatherBackground(
  weather: GreetingWeather
): { image: string; color: string } {
  if (!weather.isDay && weather.kind === "night") {
    return {
      image:
        "radial-gradient(circle at 84% 18%, rgba(255,245,195,.72) 0%, transparent 13%), " +
        "radial-gradient(circle at 24% 82%, rgba(142,132,230,.34) 0%, transparent 46%), " +
        "linear-gradient(125deg, #d5d6fa 0%, #b2b8ed 55%, #8e9bdb 100%)",
      color: "#d5d6fa",
    };
  }

  switch (weather.kind) {
    case "sunny":
      return {
        image:
          "radial-gradient(circle at 87% 18%, rgba(255,215,93,.82) 0%, transparent 29%), " +
          "linear-gradient(120deg, #fff0c2 0%, #ffe1bc 44%, #b9e5fb 100%)",
        color: "#fff0c2",
      };

    case "cloudy":
      return {
        image:
          "radial-gradient(ellipse at 82% 20%, rgba(255,255,255,.92) 0%, transparent 47%), " +
          "linear-gradient(120deg, #e4e9f8 0%, #d0d9ee 53%, #c1cfe5 100%)",
        color: "#e4e9f8",
      };

    case "rainy":
      return {
        image:
          "repeating-linear-gradient(115deg, transparent 0px, transparent 22px, rgba(255,255,255,.19) 23px, transparent 25px), " +
          "linear-gradient(120deg, #dce9f4 0%, #b9d5e8 54%, #a7c3df 100%)",
        color: "#dce9f4",
      };

    case "snowy":
      return {
        image:
          "radial-gradient(circle at 78% 25%, rgba(255,255,255,.95) 0%, transparent 24%), " +
          "radial-gradient(circle at 23% 80%, rgba(255,255,255,.7) 0%, transparent 30%), " +
          "linear-gradient(120deg, #f3faff 0%, #dceef9 55%, #c9dff5 100%)",
        color: "#f3faff",
      };

    case "stormy":
      return {
        image:
          "linear-gradient(130deg, transparent 74%, rgba(255,248,177,.65) 75%, transparent 77%), " +
          "linear-gradient(120deg, #e0ddf2 0%, #bcb9de 54%, #a3acd5 100%)",
        color: "#e0ddf2",
      };

    case "foggy":
      return {
        image:
          "linear-gradient(0deg, rgba(255,255,255,.48), transparent 75%), " +
          "linear-gradient(120deg, #e9edf3 0%, #d9e3ed 55%, #cbd7e3 100%)",
        color: "#e9edf3",
      };

    case "night":
      return {
        image:
          "linear-gradient(120deg, #d5d6fa 0%, #b2b8ed 55%, #8e9bdb 100%)",
        color: "#d5d6fa",
      };
  }
}

function dynamicBackgroundEnabled(): boolean {
  try {
    return window.localStorage.getItem(
      "my-life-greeting-dynamic-background"
    ) !== "false";
  } catch {
    return true;
  }
}

/* STEP 18F.8F.10L.2 — Rich dark gradients keyed to existing live weather. */
function greetingDarkWeatherBackground(weather: GreetingWeather): { image: string; color: string } {
  if (!weather.isDay && weather.kind === "night") {
    return {
      image: "radial-gradient(circle at 84% 18%, rgba(255,233,169,.34) 0%, transparent 19%), " +
        "linear-gradient(120deg, #202846 0%, #39365c 55%, #55517b 100%)",
      color: "#202846",
    };
  }
  switch (weather.kind) {
    case "sunny":
      return {
        image: "radial-gradient(circle at 88% 17%, rgba(255,207,105,.40) 0%, transparent 35%), " +
          "linear-gradient(120deg, #59416e 0%, #9a655f 48%, #c08b58 100%)",
        color: "#59416e",
      };
    case "cloudy":
      return {
        image: "radial-gradient(ellipse at 85% 12%, rgba(193,211,235,.24) 0%, transparent 52%), " +
          "linear-gradient(120deg, #29334e 0%, #46516a 54%, #606b80 100%)",
        color: "#29334e",
      };
    case "rainy":
      return {
        image: "repeating-linear-gradient(115deg, transparent 0px, transparent 23px, rgba(196,230,255,.10) 24px, transparent 26px), " +
          "linear-gradient(120deg, #20334d 0%, #31536c 54%, #386e78 100%)",
        color: "#20334d",
      };
    case "snowy":
      return {
        image: "radial-gradient(circle at 82% 18%, rgba(222,244,255,.30) 0%, transparent 32%), " +
          "linear-gradient(120deg, #344765 0%, #537292 54%, #738aa8 100%)",
        color: "#344765",
      };
    case "stormy":
      return {
        image: "linear-gradient(130deg, transparent 74%, rgba(255,235,145,.38) 75%, transparent 77%), " +
          "linear-gradient(120deg, #282b49 0%, #41405e 54%, #555678 100%)",
        color: "#282b49",
      };
    case "foggy":
      return {
        image: "linear-gradient(0deg, rgba(209,222,235,.13), transparent 75%), " +
          "linear-gradient(120deg, #344153 0%, #526073 54%, #697789 100%)",
        color: "#344153",
      };
    case "night":
      return {
        image: "linear-gradient(120deg, #202846 0%, #39365c 55%, #55517b 100%)",
        color: "#202846",
      };
  }
}

function weatherIcon(weather: GreetingWeather): string {
  switch (weather.kind) {
    case "sunny": return "☀️";
    case "night": return "🌙";
    case "cloudy": return weather.isDay ? "☁️" : "☁️";
    case "rainy": return "🌧️";
    case "snowy": return "❄️";
    case "stormy": return "⛈️";
    case "foggy": return "🌫️";
  }
}

/* CM.7Q.7I.21E.3A - Live manual-city weather */
export function MyLifeGreetingWeather() {
  const [preferences, setPreferences] = useState<WeatherPreferences>({
    city: "",
    mode: "manual",
    unit: "C",
  });
  const [weather, setWeather] = useState<GreetingWeather | null>(null);
  const [resolvedCity, setResolvedCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [autoCoordinates, setAutoCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const locationRequestRef = useRef(0);

  /*
   * Invalidate outstanding browser geolocation callbacks when this
   * greeting component unmounts. Coordinates remain memory-only.
   */
  useEffect(() => {
    return () => {
      locationRequestRef.current += 1;
    };
  }, []);

  const originalGreetingBackgroundRef = useRef<{
    card: HTMLElement;
    image: string;
    color: string;
    transition: string;
  } | null>(null);

  useEffect(() => {
    const update = () => setPreferences(readPreferences());
    update();

    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  /* Automatic coordinates remain in memory, never localStorage. */
  useEffect(() => {
    if (preferences.mode === "auto") return;
    locationRequestRef.current += 1;
    setAutoCoordinates(null);
    setLocationError("");
  }, [preferences.mode]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location services are unavailable");
      return;
    }

    const requestId = ++locationRequestRef.current;
    setLocationError("");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestRef.current) return;
        setAutoCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        if (requestId !== locationRequestRef.current) return;
        setAutoCoordinates(null);
        setLoading(false);
        setLocationError(
          error.code === 1
            ? "Location permission denied"
            : error.code === 3
              ? "Location request timed out"
              : "Unable to determine location"
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  };

  useEffect(() => {
    if (preferences.mode !== "auto" || !autoCoordinates) return;

    const controller = new AbortController();
    let active = true;
    let requestInFlight = false;

    setWeather(null);
    setError("");
    setLoading(true);

    const load = async () => {
      if (!active || requestInFlight) return;
      requestInFlight = true;

      try {
        const current = await fetchGreetingWeather(
          autoCoordinates.latitude,
          autoCoordinates.longitude,
          controller.signal
        );
        if (!active) return;
        setWeather(current);
        setError("");
      } catch {
        if (!active || controller.signal.aborted) return;
        setError("Weather unavailable");
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    };

    void load();
    const refresh = setInterval(() => {
      void load();
    }, 15 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(refresh);
      controller.abort();
    };
  }, [preferences.mode, autoCoordinates]);

  useEffect(() => {
    if (preferences.mode !== "manual" ||
        preferences.city.length < 2) {
      setWeather(null);
      setResolvedCity("");
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    let requestInFlight = false;
    let refresh: ReturnType<typeof setInterval> | undefined;

    setWeather(null);
    setResolvedCity("");
    setError("");
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const locations = await findGreetingWeatherLocations(
          preferences.city,
          controller.signal
        );

        if (!active) return;

        if (!locations.length) {
          throw new Error("City not found");
        }

        const location = locations[0];
        setResolvedCity(
          [location.name, location.admin1, location.country]
            .filter(Boolean)
            .join(", ")
        );

        const load = async () => {
          if (!active || requestInFlight) return;
          requestInFlight = true;

          try {
            const current = await fetchGreetingWeather(
              location.latitude,
              location.longitude,
              controller.signal
            );
            if (!active) return;
            setWeather(current);
            setError("");
          } catch {
            if (!active || controller.signal.aborted) return;
            setError("Weather unavailable");
          } finally {
            requestInFlight = false;
            if (active) setLoading(false);
          }
        };

        await load();

        if (active) {
          refresh = setInterval(load, 15 * 60 * 1000);
        }
      } catch {
        if (!active || controller.signal.aborted) return;
        setWeather(null);
        setError("City not found or weather unavailable");
        setLoading(false);
      }
    }, 700);

    return () => {
      active = false;
      clearTimeout(timer);
      if (refresh) clearInterval(refresh);
      controller.abort();
    };
  }, [preferences.city, preferences.mode]);


  /*
   * Capture the original greeting background once per card.
   * Subsequent weather changes must not replace that baseline.
   */
  useEffect(() => {
    const card = document
      .querySelector(".ml-v2-greeting-weather")
      ?.closest<HTMLElement>(".ml-v2-dashboard-welcome");

    if (!card) return;

    if (
      !originalGreetingBackgroundRef.current ||
      originalGreetingBackgroundRef.current.card !== card
    ) {
      originalGreetingBackgroundRef.current = {
        card,
        image: card.style.backgroundImage,
        color: card.style.backgroundColor,
        transition: card.style.transition,
      };
    }

    const original = originalGreetingBackgroundRef.current;

    const restoreOriginal = () => {
      card.style.removeProperty("--ml-greeting-dark-image");
      card.style.removeProperty("--ml-greeting-dark-color");
      card.style.backgroundImage = original.image;
      card.style.backgroundColor = original.color;
      card.style.transition = original.transition;
    };

    const applyGreetingWeatherBackground = () => {
      if (!weather || !dynamicBackgroundEnabled()) {
        restoreOriginal();
        return;
      }

      const theme = greetingWeatherBackground(weather);
      const darkTheme = greetingDarkWeatherBackground(weather);
      card.style.setProperty("--ml-greeting-dark-image", darkTheme.image);
      card.style.setProperty("--ml-greeting-dark-color", darkTheme.color);

      card.style.backgroundImage = theme.image;
      card.style.backgroundColor = theme.color;
      card.style.transition =
        "background-color 450ms ease, background-image 450ms ease";
    };

    applyGreetingWeatherBackground();

    window.addEventListener(
      "my-life-greeting-preferences-change",
      applyGreetingWeatherBackground
    );

    return () => {
      window.removeEventListener(
        "my-life-greeting-preferences-change",
        applyGreetingWeatherBackground
      );
      restoreOriginal();
    };
  }, [weather, preferences.mode]);

  if (preferences.mode === "auto") {
    if (weather) {
      return (
        <span
          className="ml-v2-greeting-weather"
          title="Weather for your current location. Weather by Open-Meteo."
        >
          {" · "}
          {weatherIcon(weather)}
          {" "}
          {formatGreetingTemperature(
            weather.temperatureC,
            preferences.unit
          )}
          {" "}
          {weather.description}
          {" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Weather data by Open-Meteo"
            style={{ fontSize: 10, color: "inherit", opacity: 0.75 }}
          >
            Open-Meteo
          </a>
        </span>
      );
    }

    if (loading) {
      return <span>{" · Finding local weather…"}</span>;
    }

    return (
      <span className="ml-v2-greeting-weather">
        {" · "}
        <button
          type="button"
          onClick={requestLocation}
          style={{
            border: "1px solid #bcb6d5",
            borderRadius: 7,
            background: "rgba(255,255,255,.9)",
            padding: "3px 8px",
            fontSize: 12,
            cursor: "pointer",
            color: "#6652a5",
          }}
        >
          📍 Use my location
        </button>
        {locationError || error
          ? ` · ${locationError || error}`
          : ""}
      </span>
    );
  }

  if (!preferences.city) return null;

  if (loading && !weather) {
    return <span>{" · Checking weather…"}</span>;
  }

  if (error && !weather) {
    return <span title={error}>{" · Weather unavailable"}</span>;
  }

  if (!weather) return null;

  return (
    <span
      className="ml-v2-greeting-weather"
      title={`${resolvedCity}: ${weather.description}. Weather by Open-Meteo.`}
    >
      {" · "}
      {weatherIcon(weather)}
      {" "}
      {formatGreetingTemperature(weather.temperatureC, preferences.unit)}
      {" "}
      {weather.description}
      {" "}
      <a
        href="https://open-meteo.com/"
        target="_blank"
        rel="noopener noreferrer"
        title="Weather data by Open-Meteo"
        style={{ fontSize: 10, color: "inherit", opacity: 0.75 }}
      >
        Open-Meteo
      </a>
    </span>
  );
}
