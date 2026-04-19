"use client";

import type { FruitReport, Ripeness, Verdict } from "@/lib/types";

const verdictBg: Record<Verdict, string> = {
  buy: "bg-buy",
  skip: "bg-skip",
  return: "bg-ret",
};

const verdictWord: Record<Verdict, string> = {
  buy: "BUY",
  skip: "SKIP",
  return: "RETURN",
};

function eatWhenLine(r: FruitReport): string {
  if (r.not_a_fruit) return "Couldn't make out a fruit — try again.";
  if (r.verdict === "return") return "Don't eat — take it back.";
  if (r.verdict === "skip") return "Not worth buying.";

  const d = r.eat_within_days;
  const days = d && d > 0 ? `${d} day${d === 1 ? "" : "s"}` : null;

  switch (r.ripeness) {
    case "underripe":
      return "Not ripe yet — will ripen on the counter.";
    case "ripe":
      return days ? `Ripe — eat within ${days}.` : "Ripe and ready.";
    case "peak":
      return days ? `Peak — eat within ${days}.` : "Peak — eat soon.";
    case "overripe":
      return "Overripe — use very soon.";
    case "spoiling":
      return "Going off — use today or skip.";
  }
}

const ripenessLabel: Record<Ripeness, string> = {
  underripe: "Underripe",
  ripe: "Ripe",
  peak: "Peak",
  overripe: "Overripe",
  spoiling: "Spoiling",
};

export default function ResultCard({
  result,
  thumbnailDataUrl,
}: {
  result: FruitReport;
  thumbnailDataUrl?: string;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
      <div
        className={`${verdictBg[result.verdict]} text-white px-5 py-6 text-center`}
      >
        <div className="text-5xl font-black tracking-tight leading-none">
          {verdictWord[result.verdict]}
        </div>
        <div className="mt-2 text-lg font-medium">{eatWhenLine(result)}</div>
        {!result.not_a_fruit && (
          <div className="mt-1 text-sm opacity-90">
            {result.fruit}
            {" · "}
            {ripenessLabel[result.ripeness]}
          </div>
        )}
      </div>

      {thumbnailDataUrl && (
        <img
          src={thumbnailDataUrl}
          alt={result.fruit}
          className="w-full h-40 object-cover"
        />
      )}

      {!result.not_a_fruit && (
        <div className="p-4 space-y-3">
          {result.headline && (
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              {result.headline}
            </p>
          )}

          {result.quality_notes.length > 0 && (
            <ul className="text-sm text-neutral-700 dark:text-neutral-200 space-y-1 list-disc pl-5">
              {result.quality_notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}

          {result.seasonality.note && (
            <p className="text-xs text-neutral-500">
              {result.seasonality.in_season ? "🟢 " : "🟡 "}
              {result.seasonality.note}
            </p>
          )}

          {result.storage_tips && (
            <p className="text-xs text-neutral-500">{result.storage_tips}</p>
          )}

          <p className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            AI estimate — trust your eyes. Confidence{" "}
            {Math.round(result.confidence * 100)}%.
          </p>
        </div>
      )}
    </div>
  );
}
