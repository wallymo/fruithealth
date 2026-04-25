import Anthropic from "@anthropic-ai/sdk";
import {
  IDENTIFY_PROMPT,
  IDENTIFY_SCHEMA,
  JUDGE_PROMPT,
  RESULT_SCHEMA,
} from "./prompt";
import {
  formatCueCard,
  getSeasonality,
  normalizeFruitKey,
} from "./knowledge";
import type { Form, FruitReport } from "./types";

const MODEL = process.env.GLM_MODEL ?? "glm-5.1";
const IDENTIFY_MODEL = process.env.GLM_IDENTIFY_MODEL ?? "glm-4.5v";
const BASE_URL = process.env.GLM_BASE_URL ?? "https://api.z.ai/api/anthropic";
const IDENTIFY_TOOL = "identify_fruit";
const REPORT_TOOL = "report_fruit";

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

interface IdentificationRaw {
  fruit_name: string;
  form: Form;
  not_a_fruit: boolean;
  confidence: number;
}

interface Identification extends IdentificationRaw {
  canonical_key: string | null;
}

async function identifyFruit(
  client: Anthropic,
  args: AnalyzeArgs,
): Promise<Identification> {
  const resp = await client.messages.create({
    model: IDENTIFY_MODEL,
    max_tokens: 256,
    system: IDENTIFY_PROMPT,
    tools: [
      {
        name: IDENTIFY_TOOL,
        description: "Return a structured identification of the fruit.",
        input_schema: IDENTIFY_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: IDENTIFY_TOOL },
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
          { type: "text", text: "Identify this." },
        ],
      },
    ],
  });

  const toolUse = resp.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    const text = resp.content.find((b) => b.type === "text");
    throw new Error(
      `identify: no tool_use block. text=${
        text && text.type === "text" ? text.text.slice(0, 200) : "(none)"
      }`,
    );
  }
  const input = (toolUse.input ?? {}) as Record<string, unknown>;

  // GLM sometimes deviates from the schema — accept common alternates and
  // recover gracefully so a missing field never crashes the route.
  const fruit_name =
    pickString(input, [
      "fruit_name",
      "fruit",
      "fruit_display",
      "name",
      "fruit_key",
    ]) ?? "";
  const formRaw = pickString(input, ["form", "type", "presentation"]) ?? "single";
  const form: Form =
    formRaw === "bunch" || formRaw === "package" ? formRaw : "single";
  const not_a_fruit = Boolean(input.not_a_fruit ?? input.notFruit ?? false);
  const confidenceRaw = input.confidence;
  const confidence =
    typeof confidenceRaw === "number" ? confidenceRaw : fruit_name ? 0.5 : 0.0;

  if (!fruit_name && !not_a_fruit) {
    console.warn("identify: no fruit_name in tool_use input", input);
  }

  return {
    fruit_name,
    form,
    not_a_fruit: not_a_fruit || !fruit_name,
    confidence,
    canonical_key: normalizeFruitKey(fruit_name),
  };
}

function pickString(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return null;
}

async function judgeFruit(
  client: Anthropic,
  args: AnalyzeArgs,
  id: Identification,
): Promise<FruitReport> {
  const cueCard = id.canonical_key ? formatCueCard(id.canonical_key) : null;
  const season = id.canonical_key
    ? getSeasonality(id.canonical_key, args.region, args.isoDate)
    : null;

  const knowledge = [
    `Today: ${args.isoDate}`,
    `Region: ${args.region}`,
    `Model's identification: ${id.fruit_name} (form: ${id.form}, id_confidence: ${id.confidence.toFixed(2)})`,
    cueCard
      ? `\nKnowledge card for this fruit:\n${cueCard}`
      : "\nNo knowledge card available for this fruit — rely on general knowledge but stay conservative.",
    season
      ? `\nSeasonality for this region this month: ${season.label} (in_season=${season.in_season}).\nUse this as the seasonality note: "${season.note}"`
      : "\nNo seasonality data for this fruit — infer conservatively from the region and date.",
  ].join("\n");

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: JUDGE_PROMPT,
    tools: [
      {
        name: REPORT_TOOL,
        description:
          "Report your final fruit-quality analysis for the shopper.",
        input_schema: RESULT_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: REPORT_TOOL },
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
          { type: "text", text: knowledge + "\n\nEvaluate this fruit." },
        ],
      },
    ],
  });

  const toolUse = resp.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    const text = resp.content.find((b) => b.type === "text");
    throw new Error(
      `judge: no tool_use block. text=${
        text && text.type === "text" ? text.text.slice(0, 200) : "(none)"
      }`,
    );
  }
  const report = coerceReport(toolUse.input, id, season);

  return report;
}

function coerceReport(
  input: unknown,
  id: Identification,
  season: ReturnType<typeof getSeasonality>,
): FruitReport {
  const o = (input ?? {}) as Record<string, unknown>;
  const allowedRipe = [
    "underripe",
    "ripe",
    "peak",
    "overripe",
    "spoiling",
  ] as const;
  const allowedVerdict = ["buy", "skip", "return"] as const;
  const allowedForm = ["single", "bunch", "package"] as const;

  const verdictRaw = pickString(o, ["verdict"]) ?? "skip";
  const ripenessRaw = pickString(o, ["ripeness"]) ?? "ripe";
  const formRaw = pickString(o, ["form"]) ?? id.form;

  const seasonObj = (o.seasonality ?? {}) as Record<string, unknown>;
  const eatRaw = o.eat_within_days;
  const notesRaw = o.quality_notes;

  return {
    fruit:
      pickString(o, ["fruit", "fruit_name", "fruit_display"]) ??
      id.fruit_name ??
      "unknown",
    form: (allowedForm as readonly string[]).includes(formRaw)
      ? (formRaw as Form)
      : id.form,
    verdict: (allowedVerdict as readonly string[]).includes(verdictRaw)
      ? (verdictRaw as FruitReport["verdict"])
      : "skip",
    confidence:
      typeof o.confidence === "number" ? o.confidence : id.confidence,
    headline: pickString(o, ["headline"]) ?? "",
    ripeness: (allowedRipe as readonly string[]).includes(ripenessRaw)
      ? (ripenessRaw as FruitReport["ripeness"])
      : "ripe",
    quality_notes: Array.isArray(notesRaw)
      ? notesRaw.filter((x): x is string => typeof x === "string")
      : [],
    seasonality: {
      in_season: season
        ? season.in_season
        : Boolean(seasonObj.in_season ?? false),
      note:
        (typeof seasonObj.note === "string" ? seasonObj.note : "") ||
        season?.note ||
        "",
    },
    storage_tips: pickString(o, ["storage_tips"]) ?? "",
    eat_within_days:
      typeof eatRaw === "number" && Number.isFinite(eatRaw) ? eatRaw : null,
    not_a_fruit: Boolean(o.not_a_fruit ?? false),
  };
}

function notAFruitReport(id: Identification): FruitReport {
  return {
    fruit: id.fruit_name || "unknown",
    form: id.form ?? "single",
    verdict: "skip",
    confidence: Math.max(id.confidence, 0.9),
    headline: "Can't make out a fruit — try a clearer, closer photo.",
    ripeness: "ripe",
    quality_notes: [],
    seasonality: { in_season: false, note: "" },
    storage_tips: "",
    eat_within_days: null,
    not_a_fruit: true,
  };
}

export async function analyzeFruit(args: AnalyzeArgs): Promise<FruitReport> {
  const client = makeClient();
  const id = await identifyFruit(client, args);

  if (id.not_a_fruit || id.confidence < 0.3) {
    return notAFruitReport(id);
  }

  return judgeFruit(client, args, id);
}
