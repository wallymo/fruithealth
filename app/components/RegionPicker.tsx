"use client";

import { REGIONS, type Region } from "@/lib/regions";

interface Props {
  value: Region | null;
  onChange: (region: Region) => void;
  firstRun?: boolean;
}

export default function RegionPicker({ value, onChange, firstRun }: Props) {
  return (
    <div
      className={
        firstRun
          ? "fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center p-4"
          : ""
      }
    >
      <div
        className={
          firstRun
            ? "w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-xl"
            : ""
        }
      >
        {firstRun && (
          <>
            <h2 className="text-lg font-semibold mb-1">Where are you shopping?</h2>
            <p className="text-sm text-neutral-500 mb-3">
              Used to judge seasonality. You can change it later.
            </p>
          </>
        )}
        <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-1">
          Region
        </label>
        <select
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value as Region)}
        >
          {!value && <option value="">Pick a region…</option>}
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
