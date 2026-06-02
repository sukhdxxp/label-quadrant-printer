import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requestLabelBox, type DetectPayload } from "./_detectLabelCore";

/**
 * POST /api/detect-label
 * Body: { image: dataUrl, width?, height? }
 * Returns: { box: { x, y, width, height } | null }  (fractions, top-left origin)
 *
 * The vision endpoint + model + key are read from env vars server-side so no
 * secret ever reaches the browser. Defaults target a local LM Studio server.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const body: DetectPayload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const box = await requestLabelBox(body, process.env);
    return res.status(200).json({ box });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    // 502: we reached the function but the upstream vision endpoint failed.
    return res.status(502).json({ error: message, box: null });
  }
}
