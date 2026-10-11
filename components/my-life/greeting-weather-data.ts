/* CM.7Q.7I.21E.2 - My Life greeting weather data foundation */

export type GreetingWeatherKind =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "stormy"
  | "foggy"
  | "night";

export type GreetingWeatherLocation = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

export type GreetingWeather = {
  temperatureC: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  kind: GreetingWeatherKind;
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
};

export function describeGreetingWeather(
  code: number,
  isDay: boolean
): { description: string; kind: GreetingWeatherKind } {
  if (code === 0) {
    return {
      description: isDay ? "Clear sky" : "Clear night",
      kind: isDay ? "sunny" : "night",
    };
  }

  if (code >= 1 && code <= 3) {
    return {
      description: code === 3 ? "Overcast" : "Partly cloudy",
      kind: "cloudy",
    };
  }

  if (code === 45 || code === 48) {
    return { description: "Foggy", kind: "foggy" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { description: "Drizzle", kind: "rainy" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { description: "Rain", kind: "rainy" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { description: "Snow", kind: "snowy" };
  }

  if ([95, 96, 99].includes(code)) {
    return { description: "Thunderstorm", kind: "stormy" };
  }

  return { description: "Current conditions", kind: "cloudy" };
}

async function getWeatherJson<T>(
  url: URL,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function findGreetingWeatherLocations(
  query: string,
  signal?: AbortSignal
): Promise<GreetingWeatherLocation[]> {
  const name = query.trim();

  if (name.length < 2) return [];

  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await getWeatherJson<GeocodingResponse>(
    url,
    signal
  );

  return (response.results ?? []).filter(
    (location) =>
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
  );
}

export async function fetchGreetingWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<GreetingWeather> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid weather coordinates");
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,weather_code,is_day"
  );
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", "auto");

  const response = await getWeatherJson<ForecastResponse>(
    url,
    signal
  );

  const current = response.current;

  if (
    !current ||
    typeof current.temperature_2m !== "number" ||
    !Number.isFinite(current.temperature_2m) ||
    typeof current.weather_code !== "number" ||
    !Number.isInteger(current.weather_code) ||
    (current.is_day !== 0 && current.is_day !== 1)
  ) {
    throw new Error("Invalid current weather response");
  }

  const isDay = current.is_day === 1;
  const condition = describeGreetingWeather(
    current.weather_code,
    isDay
  );

  return {
    temperatureC: current.temperature_2m,
    weatherCode: current.weather_code,
    isDay,
    ...condition,
  };
}

export function formatGreetingTemperature(
  celsius: number,
  unit: "C" | "F"
): string {
  const value =
    unit === "F" ? (celsius * 9) / 5 + 32 : celsius;

  return `${Math.round(value)}°${unit}`;
}
