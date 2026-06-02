import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { requestLabelBox, type DetectPayload } from "./api/_detectLabelCore";

/**
 * Serve POST /api/detect-label during `vite dev` using the SAME core as the
 * Vercel function, so local development needs only `pnpm dev` (no `vercel dev`)
 * and points at LM Studio by default. VISION_* vars from a local .env are read
 * here and forwarded to the detector.
 */
function detectLabelDevPlugin(env: Record<string, string>): PluginOption {
  return {
    name: "detect-label-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/detect-label", (req, res, next) => {
        if (req.method !== "POST") return next();
        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", async () => {
          try {
            const payload = JSON.parse(raw) as DetectPayload;
            const box = await requestLabelBox(payload, { ...process.env, ...env });
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ box }));
          } catch (err) {
            const message = err instanceof Error ? err.message : "Detection failed";
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: message, box: null }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load VISION_* (non VITE_-prefixed) so the dev middleware can reach them.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), detectLabelDevPlugin(env)],
  };
});
