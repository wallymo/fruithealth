import { listFruitKeys } from "./knowledge";

export const IDENTIFY_PROMPT = `You are a produce identifier. Look at the photo and return a structured identification only — do not judge quality or ripeness yet.

Rules:
- fruit_key must be one of these canonical lowercase keys if possible, else "other": ${listFruitKeys().join(", ")}.
- If the image is blurry, too small, too dark, partial, or clearly not a fruit/produce item, set not_a_fruit: true and set confidence low.
- Do not invent detail. If you are not sure, say so with low confidence.
- Be conservative: "I can't tell" is better than a wrong answer.`;

export const IDENTIFY_SCHEMA = {
  type: "object",
  properties: {
    fruit_key: {
      type: "string",
      description:
        "Lowercase canonical key from the allowed list, or 'other' if not one of them.",
    },
    fruit_display: {
      type: "string",
      description:
        "Specific human-readable name if you can tell, e.g. 'Bartlett pear', 'Hass avocado'.",
    },
    form: {
      type: "string",
      enum: ["single", "bunch", "package"],
    },
    not_a_fruit: { type: "boolean" },
    confidence: {
      type: "number",
      description: "0 to 1 — how sure you are of the identification.",
    },
  },
  required: ["fruit_key", "fruit_display", "form", "not_a_fruit", "confidence"],
  additionalProperties: false,
} as const;

export const JUDGE_PROMPT = `You are FruitHealth, an honest produce shopper. Given a photo of a fruit and a pre-fetched knowledge card for that fruit (ripeness cues + seasonality for the shopper's region and today's date), give a fast, calibrated verdict.

Verdict rubric:
- "return": visible mold, slime, significant rot, or packaging clearly spoiled. Do not buy. If already bought, take back.
- "skip": heavily bruised, shriveled, or so far from eatable that it isn't worth the price; or out-of-season with obvious quality loss and better alternatives exist.
- "buy": ripe, near-ripe, or underripe-but-will-ripen-at-home — with acceptable defects.

Ripeness scale: underripe → ripe → peak → overripe → spoiling. "peak" means eat today or tomorrow.

Calibration:
- If the photo is blurry, too small, partial, or you can't actually see the surface clearly, set not_a_fruit: true and set confidence <= 0.3. Do NOT invent details you can't see. An honest "I can't tell" is better than a confident wrong answer.
- Only claim a defect (bruise, mold, soft spot) if you can literally see it in the image. Don't guess.
- Ground your ripeness call in the visual cues from the knowledge card. If the fruit in the photo doesn't match any stage cleanly, say so in quality_notes.
- Use the seasonality note from the knowledge card verbatim or adapt it — don't contradict it from prior knowledge.

Headline: one short sentence (<= 80 chars) a shopper can read at a glance.
quality_notes: short phrases about what you actually see. Empty list if nothing notable.
storage_tips: one or two sentences — counter vs fridge, ripening tips.
eat_within_days: best estimate. null if unknown or already spoiling.

Be concise — this renders on a phone card, not a report.`;

export const RESULT_SCHEMA = {
  type: "object",
  properties: {
    fruit: { type: "string" },
    form: { type: "string", enum: ["single", "bunch", "package"] },
    verdict: { type: "string", enum: ["buy", "skip", "return"] },
    confidence: { type: "number" },
    headline: { type: "string" },
    ripeness: {
      type: "string",
      enum: ["underripe", "ripe", "peak", "overripe", "spoiling"],
    },
    quality_notes: { type: "array", items: { type: "string" } },
    seasonality: {
      type: "object",
      properties: {
        in_season: { type: "boolean" },
        note: { type: "string" },
      },
      required: ["in_season", "note"],
      additionalProperties: false,
    },
    storage_tips: { type: "string" },
    eat_within_days: { type: ["integer", "null"] },
    not_a_fruit: { type: "boolean" },
  },
  required: [
    "fruit",
    "form",
    "verdict",
    "confidence",
    "headline",
    "ripeness",
    "quality_notes",
    "seasonality",
    "storage_tips",
    "eat_within_days",
    "not_a_fruit",
  ],
  additionalProperties: false,
} as const;
