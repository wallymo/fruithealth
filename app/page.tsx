"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CaptureButton from "./components/CaptureButton";
import RegionPicker from "./components/RegionPicker";
import ResultCard from "./components/ResultCard";
import { processImage } from "@/lib/image";
import { getRegion, setRegion, type Region } from "@/lib/regions";
import { getLastScan, saveScan } from "@/lib/history";
import type { FruitReport, Scan } from "@/lib/types";

export default function Home() {
  const [region, setRegionState] = useState<Region | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<Scan | null>(null);

  useEffect(() => {
    const r = getRegion();
    setRegionState(r);
    if (!r) setShowPicker(true);
    void (async () => {
      const last = await getLastScan();
      if (last) setLatest(last);
    })();
  }, []);

  const onRegion = (r: Region) => {
    setRegion(r);
    setRegionState(r);
    setShowPicker(false);
  };

  const onFile = async (file: File) => {
    if (!region) {
      setShowPicker(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const img = await processImage(file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: img.base64,
          mediaType: img.mediaType,
          region,
          isoDate: new Date().toISOString().slice(0, 10),
        }),
      });
      const data: { result?: FruitReport; error?: string } = await res.json();
      if (!res.ok || !data.result) {
        throw new Error(data.error || `request failed (${res.status})`);
      }
      const scan: Scan = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        thumbnailDataUrl: img.thumbnailDataUrl,
        region,
        result: data.result,
      };
      await saveScan(scan);
      setLatest(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col p-4 gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FruitHealth</h1>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => setShowPicker(true)}
            className="text-neutral-500 underline-offset-2 hover:underline"
          >
            {region ?? "Set region"}
          </button>
          <Link
            href="/history"
            className="text-neutral-500 underline-offset-2 hover:underline"
          >
            History
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <p className="text-center text-neutral-500">
          Take a photo of a fruit, bunch, or package. Get an instant verdict.
        </p>

        <CaptureButton onFile={onFile} busy={busy} />

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-900 text-red-800 dark:text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {latest && !busy && (
          <ResultCard
            result={latest.result}
            thumbnailDataUrl={latest.thumbnailDataUrl}
          />
        )}
      </div>

      {showPicker && (
        <RegionPicker
          value={region}
          onChange={onRegion}
          firstRun={!region}
        />
      )}
    </main>
  );
}
