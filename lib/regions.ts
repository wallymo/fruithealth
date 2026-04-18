export const REGIONS = [
  "Northeast US",
  "Southeast US",
  "Midwest US",
  "Southwest US",
  "Pacific Northwest US",
  "California / West Coast US",
  "Canada",
  "Mexico / Central America",
  "Northern Europe",
  "Southern Europe / Mediterranean",
  "UK & Ireland",
  "East Asia",
  "Southeast Asia",
  "South Asia",
  "Middle East",
  "Sub-Saharan Africa",
  "Australia / New Zealand",
  "South America",
] as const;

export type Region = (typeof REGIONS)[number];

const KEY = "fruithealth.region";

export function getRegion(): Region | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return (REGIONS as readonly string[]).includes(v ?? "")
    ? (v as Region)
    : null;
}

export function setRegion(region: Region): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, region);
}
