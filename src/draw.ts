/**
 * 1-ITZ  ESPORTS(ITZ) 🇲🇦
2-BAE FLAMES (BAE) 🇲🇦🇩🇿
3-PHOENIX LADIES (IX) 🇲🇦🇩🇿
4-7C ESPORTS (7C) 🇸🇦
5-IMPERIAL VIXENS (IV) 🇩🇿
6-UN REAL(UR) 🇩🇿🇹🇳
7-HARD GIRLS (HARD) 🇩🇿🇪🇬
8-INEXORABLE (in) 🇲🇦
9-X SEVEN SISTER'S (x7) 🇩🇿
10-IQ GIRLS (IQ) 🇪🇬
11-Z1 ESPORTS (Z1)🇸🇦
12-M2 ESPORTS (M2) 🇪🇬
13-IMPACT LADIES  (IMPACT) 🇲🇦
14-MIDINGHT SPECTRE SQUAD (MSS) 1🇩🇿
15-MIDINGHT SPECTRE SQUAD (MSS) 2🇩🇿
16-FIRST TEAM (1)🇩🇿
17-JAW BREAKERS (JAW)🇲🇦
18-MG LADIES(MG)🇲🇦🇱🇧
19-ATHENA LADIES (ATN)
20-THE ULTIMATES (TU)🇩🇿
21-ONE SPIRIT (1S)🇩🇿
22-FLAMES 1(F1)🇵🇰
23-POWER GIRLS (PWR)🇪🇬
24-POWER GIRLS (PWR)🇪🇬
25-LAVA E-SPORT GIRLS (LAVA)🇪🇬🇲🇦
26-YIKES AWE🇷🇺 (AW E)
27-VINCERE MORTEM OXX🇷🇺 (VIM)
28-ROSCAR ESPORTSGIRLS🇷🇴(RS)
29-1SET GIRLS 🇪🇬(1SET)
30- Z1 ESPORTS  🇪🇬(z1) 
31- TOP CREW LADIES (TC) 🇩🇿 
32-DNA GIRLS
 */
export const SAMPLE_NAMES = [
  "ITZ  ESPORTS(ITZ) 🇲🇦",
  "BAE FLAMES (BAE) 🇲🇦🇩🇿",
  "PHOENIX LADIES (IX) 🇲🇦🇩🇿",
  "7C ESPORTS (7C) 🇸🇦",
  "IMPERIAL VIXENS (IV) 🇩🇿",
  "UN REAL(UR) 🇩🇿🇹🇳",
  "HARD GIRLS (HARD) 🇩🇿🇪🇬",
  "INEXORABLE (in) 🇲🇦",
  "X SEVEN SISTER'S (x7) 🇩🇿",
  "IQ GIRLS (IQ) 🇪🇬",
  "Z1 ESPORTS (Z1)🇸🇦",
  "M2 ESPORTS (M2) 🇪🇬",
  "IMPACT LADIES  (IMPACT) 🇲🇦",
  "MIDINGHT SPECTRE SQUAD (MSS) 1🇩🇿",
  "MIDINGHT SPECTRE SQUAD (MSS) 2🇩🇿",
  "FIRST TEAM (1)🇩🇿",
  "JAW BREAKERS (JAW)🇲🇦",
  "MG LADIES(MG)🇲🇦🇱🇧",
  "ATHENA LADIES (ATN)",
  "THE ULTIMATES (TU)🇩🇿",
  "ONE SPIRIT (1S)🇩🇿",
  "FLAMES 1(F1)🇵🇰",
  "POWER GIRLS (PWR)🇪🇬",
  "LAVA E-SPORT GIRLS (LAVA)🇪🇬🇲🇦",
  "YIKES AWE🇷🇺 (AW E)",
  "VINCERE MORTEM OXX🇷🇺 (VIM)",
  "ROSCAR ESPORTSGIRLS🇷🇴(RS)",
  "1SET GIRLS 🇪🇬(1SET)",
  "Z1 ESPORTS  🇪🇬(z1)",
  "TOP CREW LADIES (TC) 🇩🇿",
  "DNA GIRLS",
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
