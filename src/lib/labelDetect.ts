/**
 * Client side of automatic label detection.
 *
 * Downscales the source to a modest size (the bounding box is resolution
 * independent, and vision models don't need full res — this keeps the request
 * under the serverless body limit and the round-trip fast), POSTs it to the
 * /api/detect-label serverless function, and returns the label's bounding box
 * as fractions of the *unrotated* image (0..1, top-left origin), or null.
 */

export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Longest side of the image actually sent to the model. */
const DETECT_MAX_SIDE = 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

/** Scale the image down to DETECT_MAX_SIDE and re-encode as JPEG for transport. */
async function downscaleForDetect(
  dataUrl: string,
): Promise<{ image: string; width: number; height: number }> {
  const img = await loadImage(dataUrl);
  const longest = Math.max(img.width, img.height) || 1;
  const scale = Math.min(1, DETECT_MAX_SIDE / longest);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, 0, 0, width, height);
  return { image: canvas.toDataURL("image/jpeg", 0.85), width, height };
}

// Memoise successful detections by source data URL so re-editing an already
// placed label (which reuses the same source) doesn't call the model again.
// Misses (no label / endpoint down) are not cached, leaving room to retry.
const cache = new Map<string, NormalizedBox>();

/**
 * Detect the shipping label in the given image. Best-effort: resolves to null on
 * any failure (endpoint down, no label, bad response) so callers can degrade to
 * plain manual cropping. Pass an AbortSignal to cancel an in-flight detection.
 */
export async function detectLabelBox(
  dataUrl: string,
  signal?: AbortSignal,
): Promise<NormalizedBox | null> {
  const cached = cache.get(dataUrl);
  if (cached) return cached;
  try {
    const payload = await downscaleForDetect(dataUrl);
    const res = await fetch("/api/detect-label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { box?: NormalizedBox | null };
    const box = data.box;
    if (!box || typeof box.x !== "number") return null;
    cache.set(dataUrl, box);
    return box;
  } catch {
    return null;
  }
}
