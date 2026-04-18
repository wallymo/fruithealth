"use client";

import type { FruitReport, Verdict } from "@/lib/types";

const verdictStyle: Record<Verdict, string> = {
  buy: "bg-buy text-white",
  skip: "bg-skip text-white",
  return: "bg-ret text-white",
};

const verdictLabel: Record<Verdict, string> = {
  buy: "Buy",
  skip: "Skip",
  return: "Return",
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
      {thumbnailDataUrl && (
        <img
          src={thumbnailDataUrl}
          alt={result.fruit}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {result.fruit}
            </div>
            <div className="text-lg font-semibold mt-0.5">
              {result.headline}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${verdictStyle[result.verdict]}`}
          >
            {verdictLabel[result.verdict]}
          </span>
        </div>

        {!result.not_a_fruit && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Chip label={`Ripeness: ${result.ripeness}`} />
            <Chip
              label={
                result.seasonality.in_season ? "In season" : "Out of season"
              }
              tone={result.seasonality.in_season ? "good" : "warn"}
            />
            {result.eat_within_days !== null && (
              <Chip label={`Eat within ${result.eat_within_days}d`} />
            )}
          </div>
        )}

        {result.seasonality.note && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {result.seasonality.note}
          </p>
        )}

        {result.quality_notes.length > 0 && (
          <ul className="text-sm text-neutral-700 dark:text-neutral-200 space-y-1 list-disc pl-5">
            {result.quality_notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}

        {result.storage_tips && !result.not_a_fruit && (
          <p className="text-sm text-neutral-500">{result.storage_tips}</p>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
      : tone === "warn"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${cls}`}>
      {label}
    </span>
  );
}
