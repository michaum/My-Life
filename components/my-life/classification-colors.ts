// STEP P36C.1K.17C - Browser-persistent Classification colors.

export const CLASSIFICATION_COLOR_KEY =
  "my-life-v2-classification-colors";

export const CLASSIFICATION_PASTELS = [
  "#a58bd5",
  "#65b7a0",
  "#d99c79",
  "#79a9d5",
  "#d78eaf",
  "#b5a05a",
  "#b5a0d9",
  "#79b9b0",
  "#e0a0a0",
  "#8eadd0",
  "#c69fc9",
  "#b6ae75",
];

export type ClassificationColors = Record<string, string>;

export function validClassificationColor(value: unknown): value is string {
  return typeof value === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value);
}

export function readClassificationColors(): ClassificationColors {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(CLASSIFICATION_COLOR_KEY) || "{}"
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([name, color]) =>
          name.length > 0 && validClassificationColor(color)
      )
    ) as ClassificationColors;
  } catch {
    return {};
  }
}

// Retain the colors used before persistent mappings were introduced.
export function legacyClassificationColor(name: string): string {
  const oldPalette = CLASSIFICATION_PASTELS.slice(0, 6);
  let hash = 0;
  for (const char of name.toLowerCase()) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }
  return oldPalette[(hash >>> 0) % oldPalette.length];
}

export function getClassificationColor(name: string): string {
  return readClassificationColors()[name] ||
    legacyClassificationColor(name);
}

export function nextClassificationColor(
  names: string[],
  colors: ClassificationColors
): string {
  const usage = new Map<string, number>();
  for (const name of names) {
    const color = (
      colors[name] || legacyClassificationColor(name)
    ).toLowerCase();
    usage.set(color, (usage.get(color) || 0) + 1);
  }

  return CLASSIFICATION_PASTELS.reduce((best, color) => {
    return (usage.get(color) || 0) < (usage.get(best) || 0)
      ? color
      : best;
  }, CLASSIFICATION_PASTELS[0]);
}
