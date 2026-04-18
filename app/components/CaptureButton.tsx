"use client";

import { useRef } from "react";

interface Props {
  onFile: (file: File) => void;
  busy: boolean;
}

export default function CaptureButton({ onFile, busy }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="w-full rounded-2xl bg-buy text-white text-lg font-semibold py-5 shadow-lg active:scale-[0.99] transition disabled:opacity-60"
      >
        {busy ? "Analyzing…" : "Scan fruit"}
      </button>
    </>
  );
}
