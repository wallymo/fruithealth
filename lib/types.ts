export type Verdict = "buy" | "skip" | "return";
export type Ripeness =
  | "underripe"
  | "ripe"
  | "peak"
  | "overripe"
  | "spoiling";
export type Form = "single" | "bunch" | "package";

export interface FruitReport {
  fruit: string;
  form: Form;
  verdict: Verdict;
  confidence: number;
  headline: string;
  ripeness: Ripeness;
  quality_notes: string[];
  seasonality: { in_season: boolean; note: string };
  storage_tips: string;
  eat_within_days: number | null;
  not_a_fruit: boolean;
}

export interface Scan {
  id: string;
  createdAt: number;
  thumbnailDataUrl: string;
  region: string;
  result: FruitReport;
}
