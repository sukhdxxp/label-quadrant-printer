/**
 * Shared label-detection logic, deliberately free of any HTTP-framework types so
 * it can run in three places from one source of truth:
 *   - the Vercel serverless function (api/detect-label.ts)
 *   - the Vite dev-server middleware (vite.config.ts)
 *   - unit tests (this file's pure helpers)
 *
 * It asks an OpenAI-compatible vision endpoint (LM Studio, vLLM, hosted, …) to
 * locate the shipping label inside a page that may also contain other content,
 * and returns its bounding box as fractions of the image (0..1, top-left origin).
 */

/** Bounding box as fractions of the image: 0..1, top-left origin. */
export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectPayload {
  /** data: URL of the (already downscaled) image to inspect. */
  image: string;
  /** Pixel dimensions of `image`, used only to normalise pixel-space answers. */
  width?: number;
  height?: number;
}

export interface VisionConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

/**
 * Resolve endpoint config from the environment, defaulting to a local LM Studio
 * server so `pnpm dev` works out of the box. Override in production via Vercel
 * env vars (VISION_BASE_URL / VISION_MODEL / VISION_API_KEY).
 */
export function resolveConfig(env: Record<string, string | undefined>): VisionConfig {
  return {
    baseUrl: env.VISION_BASE_URL?.trim() || "http://localhost:1234/v1",
    // LM Studio routes to whatever model is loaded; "local-model" is a safe
    // placeholder it accepts. Set VISION_MODEL to be explicit.
    model: env.VISION_MODEL?.trim() || "local-model",
    apiKey: env.VISION_API_KEY?.trim() || undefined,
  };
}

const PROMPT = [
  "You locate the shipping/address label on a page.",
  "The page may also contain other content (instructions, invoices, return forms, ads).",
  "Find the single main shipping label — the rectangular region holding the delivery",
  "address and/or the postage barcode/QR code.",
  "",
  "Respond with ONLY a compact JSON object giving its bounding box, top-left origin.",
  "ALL FOUR values MUST be decimals between 0 and 1 (fractions of the image width/height),",
  "never pixels and never a 0-1000 scale. Use the SAME 0-1 scale for every value.",
  'Format: {"x":<left>,"y":<top>,"width":<w>,"height":<h>}.',
  'Example for a label across the top third: {"x":0.04,"y":0.05,"width":0.92,"height":0.4}.',
  'If there is no shipping label, respond with exactly {"label":false}.',
  "Do not include any other text, explanation, or markdown.",
].join("\n");

// Generous enough that reasoning models (which spend tokens thinking before they
// emit the JSON) still reach the answer instead of stopping mid-thought.
const MAX_TOKENS = 1536;

/** Build the OpenAI-compatible chat-completions request body. */
export function buildRequestBody(model: string, imageDataUrl: string) {
  return {
    model,
    temperature: 0,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  };
}

/** Pull the first balanced JSON object out of a model's text response. */
export function extractJsonObject(text: string): unknown {
  if (!text) return null;
  // Strip ```json fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(body.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * Turn a parsed model answer into a normalised box, tolerating the common ways
 * vision models drift: 0..1 fractions, 0..1000 integer scale, raw pixels, and
 * either {x,y,width,height} or {x1,y1,x2,y2}/{left,top,right,bottom} / [a,b,c,d].
 * Returns null for "no label", malformed answers, or degenerate boxes.
 */
export function normalizeBox(
  parsed: unknown,
  imgW?: number,
  imgH?: number,
): NormalizedBox | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.label === false || o.label === "false") return null;

  // Gather (x, y, w, h) in whatever space the model used.
  let x: number | null;
  let y: number | null;
  let w: number | null;
  let h: number | null;

  if (Array.isArray(parsed) || Array.isArray(o.box) || Array.isArray(o.bbox)) {
    const arr = (Array.isArray(parsed) ? parsed : (o.box ?? o.bbox)) as unknown[];
    [x, y, w, h] = [num(arr[0]), num(arr[1]), num(arr[2]), num(arr[3])];
  } else if (
    o.x2 !== undefined || o.right !== undefined || o.xmax !== undefined
  ) {
    // corner form -> width/height
    const x1 = num(o.x1 ?? o.left ?? o.xmin ?? o.x);
    const y1 = num(o.y1 ?? o.top ?? o.ymin ?? o.y);
    const x2 = num(o.x2 ?? o.right ?? o.xmax);
    const y2 = num(o.y2 ?? o.bottom ?? o.ymax);
    x = x1;
    y = y1;
    w = x1 != null && x2 != null ? x2 - x1 : null;
    h = y1 != null && y2 != null ? y2 - y1 : null;
  } else {
    x = num(o.x ?? o.left ?? o.xmin);
    y = num(o.y ?? o.top ?? o.ymin);
    w = num(o.width ?? o.w);
    h = num(o.height ?? o.h);
  }

  if (x == null || y == null || w == null || h == null) return null;
  if (w <= 0 || h <= 0) return null;

  // Decide the coordinate space PER AXIS, because models sometimes mix scales
  // (e.g. x/width as 0..1 fractions but y/height on a 0..1000 scale). Each axis
  // is judged by its own extent (far edge = origin + size).
  const scaleX = pickScale(Math.max(Math.abs(x), Math.abs(x + w)), imgW);
  const scaleY = pickScale(Math.max(Math.abs(y), Math.abs(y + h)), imgH);
  if (scaleX == null || scaleY == null) return null;

  const box: NormalizedBox = {
    x: x / scaleX,
    y: y / scaleY,
    width: w / scaleX,
    height: h / scaleY,
  };
  return clampBox(box);
}

/**
 * Infer the divisor that maps a coordinate value back to a 0..1 fraction, from
 * the largest value seen on that axis: already-fractions (≤1.5), a 0..1000
 * integer scale, or — as a last resort — raw pixels against a known dimension.
 * Returns null for pixel values with no dimension to normalise against.
 */
function pickScale(extent: number, imgDim?: number): number | null {
  if (extent <= 1.5) return 1;
  if (extent <= 1000) return 1000;
  if (imgDim) return imgDim;
  return null;
}

/** Clamp a box to the image and reject anything degenerate after clamping. */
export function clampBox(box: NormalizedBox): NormalizedBox | null {
  const x = Math.min(Math.max(box.x, 0), 1);
  const y = Math.min(Math.max(box.y, 0), 1);
  const width = Math.min(box.width, 1 - x);
  const height = Math.min(box.height, 1 - y);
  // Ignore boxes that are essentially the whole page (no useful crop) or slivers.
  if (width < 0.02 || height < 0.02) return null;
  return { x, y, width, height };
}

/**
 * Call the vision endpoint and return the label box, or null when no label is
 * found. Throws only on transport/endpoint failure so callers can map it to 502.
 */
export async function requestLabelBox(
  payload: DetectPayload,
  env: Record<string, string | undefined>,
  signal?: AbortSignal,
): Promise<NormalizedBox | null> {
  if (!payload?.image || typeof payload.image !== "string") {
    throw new Error("Missing image");
  }
  const cfg = resolveConfig(env);
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(buildRequestBody(cfg.model, payload.image)),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Vision endpoint ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: unknown; reasoning_content?: unknown } }[];
  };
  const msg = data.choices?.[0]?.message;
  const fromContent = normalizeBox(
    extractJsonObject(asText(msg?.content)),
    payload.width,
    payload.height,
  );
  if (fromContent) return fromContent;
  // Reasoning models occasionally leave the answer only in reasoning_content.
  return normalizeBox(
    extractJsonObject(asText(msg?.reasoning_content)),
    payload.width,
    payload.height,
  );
}

/** Flatten an OpenAI message content field (string or content-part array) to text. */
function asText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => (p as { text?: string }).text ?? "").join("");
  }
  return "";
}
