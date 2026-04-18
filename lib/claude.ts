import Anthropic from "@anthropic-ai/sdk";
import { RESULT_SCHEMA, SYSTEM_PROMPT } from "./prompt";
import type { FruitReport } from "./types";

const client = new Anthropic();

const MODEL = "claude-sonnet-4-6";
const TOOL_NAME = "report_fruit";

export interface AnalyzeArgs {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  region: string;
  isoDate: string;
}

export async function analyzeFruit(args: AnalyzeArgs): Promise<FruitReport> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
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
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }
  return toolUse.input as FruitReport;
}
