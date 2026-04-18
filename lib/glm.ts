import { RESULT_SCHEMA, SYSTEM_PROMPT } from "./prompt";
import type { FruitReport } from "./types";

const ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const MODEL = process.env.GLM_MODEL ?? "glm-4.5v";

export interface AnalyzeArgs {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  region: string;
  isoDate: string;
}

interface GLMResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export async function analyzeFruit(args: AnalyzeArgs): Promise<FruitReport> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) throw new Error("GLM_API_KEY not set");

  const systemMsg =
    SYSTEM_PROMPT +
    "\n\nReturn a single JSON object matching exactly this JSON Schema. No markdown, no prose, no <think> tags — only the JSON object.\n" +
    JSON.stringify(RESULT_SCHEMA);

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemMsg },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${args.mediaType};base64,${args.imageBase64}`,
            },
          },
          {
            type: "text",
            text: `Region: ${args.region}\nToday: ${args.isoDate}\n\nEvaluate this fruit. Respond ONLY with the JSON object.`,
          },
        ],
      },
    ],
    max_tokens: 1024,
    temperature: 0.1,
    response_format: { type: "json_object" },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GLM API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as GLMResponse;
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("no content in GLM response");

  const jsonText = extractJSON(raw);
  return JSON.parse(jsonText) as FruitReport;
}

function extractJSON(s: string): string {
  const stripped = s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : stripped;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return candidate;
  return candidate.slice(start, end + 1);
}
