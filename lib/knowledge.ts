import seasonalityData from "@/data/seasonality.json";
import cuesData from "@/data/fruit-cues.json";

type RegionKind = "north" | "south" | "tropical";

interface SeasonalityJSON {
  regions: Record<string, RegionKind>;
  fruits: Record<string, number[]>;
}

interface FruitCue {
  display: string;
  aliases?: string[];
  cues: Record<string, string>;
  defects: string[];
}

interface CuesJSON {
  [key: string]: FruitCue;
}

const seasonality = seasonalityData as unknown as SeasonalityJSON;
const cues = cuesData as unknown as CuesJSON;

const FRUIT_KEYS = Object.keys(cues);

export function listFruitKeys(): string[] {
  return FRUIT_KEYS;
}

export function normalizeFruitKey(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  if (cues[lower]) return lower;
  for (const [key, entry] of Object.entries(cues)) {
    if (entry.aliases?.some((a) => a.toLowerCase() === lower)) return key;
  }
  for (const [key, entry] of Object.entries(cues)) {
    if (lower.includes(key)) return key;
    if (entry.aliases?.some((a) => lower.includes(a.toLowerCase()))) return key;
  }
  return null;
}

export function getCues(fruitKey: string): FruitCue | null {
  return cues[fruitKey] ?? null;
}

export interface SeasonalityResult {
  score: 0 | 1 | 2;
  label: "out of season" | "shoulder season" | "peak season";
  in_season: boolean;
  note: string;
}

export function getSeasonality(
  fruitKey: string,
  region: string,
  isoDate: string,
): SeasonalityResult | null {
  const arr = seasonality.fruits[fruitKey];
  if (!arr) return null;

  const kind = seasonality.regions[region] ?? "north";
  const month = new Date(isoDate + "T12:00:00Z").getUTCMonth();

  let score: number;
  if (kind === "tropical") {
    score = 2;
  } else if (kind === "south") {
    score = arr[(month + 6) % 12];
  } else {
    score = arr[month];
  }

  const label =
    score === 2 ? "peak season" : score === 1 ? "shoulder season" : "out of season";
  const monthName = new Date(isoDate + "T12:00:00Z").toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const note =
    kind === "tropical"
      ? `${monthName} in ${region}: imported/tropical region — generally available year-round.`
      : score === 2
        ? `${monthName} is peak ${fruitKey} season in ${region}.`
        : score === 1
          ? `${monthName} is the shoulder of ${fruitKey} season in ${region} — quality varies.`
          : `${monthName} is out of local ${fruitKey} season in ${region} — expect imported fruit, higher price, often lower quality.`;

  return {
    score: score as 0 | 1 | 2,
    label,
    in_season: score > 0,
    note,
  };
}

export function formatCueCard(fruitKey: string): string | null {
  const entry = cues[fruitKey];
  if (!entry) return null;
  const lines = [
    `Fruit: ${entry.display}`,
    "Ripeness visual cues:",
    ...Object.entries(entry.cues).map(([stage, desc]) => `  - ${stage}: ${desc}`),
    `Common defects for this fruit: ${entry.defects.join("; ")}.`,
  ];
  return lines.join("\n");
}
