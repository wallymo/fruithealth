import Anthropic from "@anthropic-ai/sdk";
import { RESULT_SCHEMA, SYSTEM_PROMPT } from "./prompt";
import type { FruitReport } from "./types";

const MODEL = process.env.GLM_MODEL ?? "glm-5.1";
const BASE_URL = process.env.GLM_BASE_URL ?? "https://api.z.ai/api/anthropic";
const TOOL_NAME = "report_fruit";

function makeClient() {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) throw new Error("GLM_API_KEY not set");
  return new Anthropic({ apiKey, baseURL: BASE_URL });
}

export interface AnalyzeArgs {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  region: string;
  isoDate: string;
}

export async function analyzeFruit(args: AnalyzeArgs): Promise<FruitReport> {
  const client = makeClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Report your analysis of the fruit in the photo so the shopper can act on it.",
        input_schema: RESULT_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: args.mediaType,
              data: args.imageBase64,
            },
          },
          {
            type: "text",
            text: `Region: ${args.region}\nToday: ${args.isoDate}\n\nEvaluate this fruit.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (toolUse && toolUse.type === "tool_use") {
    return toolUse.input as FruitReport;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (textBlock && textBlock.type === "text") {
    return JSON.parse(extractJSON(textBlock.text)) as FruitReport;
  }

  throw new Error("GLM returned no usable tool_use or text content");
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
