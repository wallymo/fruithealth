"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listScans } from "@/lib/history";
import type { Scan, Verdict } from "@/lib/types";

const verdictColor: Record<Verdict, string> = {
  buy: "bg-buy",
  skip: "bg-skip",
  return: "bg-ret",
};

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[] | null>(null);

  useEffect(() => {
    void (async () => setScans(await listScans()))();
  }, []);

  return (
    <main className="flex-1 flex flex-col p-4 gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Link
          href="/"
          className="text-sm text-neutral-500 underline-offset-2 hover:underline"
        >
          Home
        </Link>
      </header>

      {scans === null && <p className="text-neutral-500">Loading…</p>}
      {scans && scans.length === 0 && (
        <p className="text-neutral-500">
          No scans yet. Go back and scan something.
        </p>
      )}

      <ul className="space-y-3">
        {scans?.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-neutral-900 p-2 shadow-sm"
          >
            <img
              src={s.thumbnailDataUrl}
              alt={s.result.fruit}
              className="h-16 w-16 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{s.result.fruit}</div>
              <div className="text-sm text-neutral-500 truncate">
                {s.result.headline}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${verdictColor[s.result.verdict]}`}
            >
              {s.result.verdict}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
