export const SAMPLE_NAMES = [
  "KADOUR GAMING",
  "MALUMA GAMING",
  "MiGalou",
  "ROFY",
  "SEYOO",
  "KRATOS",
  "ISLEMUP",
  "PERLA GAMING",
  "QBAYLIxLIVE",
  "HAMSA STREAM"
];

export function parseNames(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[\n,;]+/)
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function randomIndex(size: number): number {
  const buffer = new Uint32Array(1);
  const limit = 2 ** 32 - (2 ** 32 % size);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % size;
}

function shuffle(names: string[]): string[] {
  const result = [...names];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function drawNames(
  names: string[],
  count: number,
  guaranteed: string[] = [],
): string[] {
  if (!Number.isInteger(count) || count < 1 || count > names.length) {
    throw new Error(
      "Choose a draw size between 1 and your active player count.",
    );
  }
  if (
    new Set(names.map((name) => name.toLocaleLowerCase())).size !==
      names.length ||
    names.some((name) => !name.trim())
  ) {
    throw new Error("Player names must be unique and non-empty.");
  }
  const locked = [...new Set(guaranteed)];
  if (locked.some((name) => !names.includes(name)))
    throw new Error("Every guaranteed player must be in the active roster.");
  if (locked.length > count)
    throw new Error("The draw size must fit all guaranteed players.");
  const pool = names.filter((name) => !locked.includes(name));
  return shuffle([...locked, ...shuffle(pool).slice(0, count - locked.length)]);
}
