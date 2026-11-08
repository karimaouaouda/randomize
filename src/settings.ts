import { SAMPLE_NAMES } from "./draw.ts";
import { sanitizeLogos } from "./logos.ts";

export type Settings = {
  names: string[];
  logos: Record<string, string>;
  count: number;
  guaranteed: string[];
  title: string;
  cinematic: boolean;
};

export const DEFAULTS: Settings = {
  names: SAMPLE_NAMES,
  logos: {},
  count: 4,
  guaranteed: [],
  title: "COMMUNITY DROP",
  cinematic: true,
};

export function validateSettings(value: unknown): Settings {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings.");
  const data = value as Record<string, unknown>;
  if (
    !Array.isArray(data.names) ||
    !data.names.length ||
    data.names.length > 500 ||
    !data.names.every(
      (name: unknown) =>
        typeof name === "string" &&
        name.trim() === name &&
        name.length > 0 &&
        name.length <= 64,
    ) ||
    new Set(data.names.map((name: string) => name.toLocaleLowerCase())).size !==
      data.names.length
  ) {
    throw new Error("Use 1–500 unique names, up to 64 characters each.");
  }
  const names: string[] = data.names;
  const logos = sanitizeLogos(data.logos, names);
  if (
    !data.logos ||
    typeof data.logos !== "object" ||
    Array.isArray(data.logos) ||
    Object.keys(data.logos).length !== Object.keys(logos).length
  )
    throw new Error("Invalid team logos.");
  if (
    typeof data.count !== "number" ||
    !Number.isInteger(data.count) ||
    data.count < 0 ||
    data.count > 500
  )
    throw new Error("Draw size must be a whole number from 0 to 500.");
  if (
    !Array.isArray(data.guaranteed) ||
    !data.guaranteed.every(
      (name: unknown) => typeof name === "string" && names.includes(name),
    ) ||
    new Set(data.guaranteed).size !== data.guaranteed.length
  )
    throw new Error("Guaranteed names must be unique roster members.");
  if (
    typeof data.title !== "string" ||
    data.title.length > 48 ||
    typeof data.cinematic !== "boolean"
  )
    throw new Error("Invalid event title or animation setting.");
  return {
    names,
    logos,
    count: data.count,
    guaranteed: data.guaranteed,
    title: data.title,
    cinematic: data.cinematic,
  };
}

export function readLocalSettings(): Settings {
  try {
    const data = JSON.parse(
      localStorage.getItem("dropzone-settings") || "null",
    );
    if (!data || typeof data !== "object") return DEFAULTS;
    return validateSettings({
      ...DEFAULTS,
      ...data,
      logos: sanitizeLogos(
        data.logos,
        Array.isArray(data.names) ? data.names : [],
      ),
    });
  } catch {
    return DEFAULTS;
  }
}
