import { NextResponse } from "next/server";
import { analyzeFruit } from "@/lib/glm";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeRequest {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  region: string;
  isoDate: string;
}

export async function POST(req: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.imageBase64 || !body.mediaType || !body.region || !body.isoDate) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  try {
    const result = await analyzeFruit(body);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
