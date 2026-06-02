# Label Quadrant Printer

Client-side React app that places images into a chosen quadrant of an A4
TownStix 4-per-sheet label layout (105 × 148.5 mm cells), previews accurately,
and exports a print-ready A4 PDF. Static + Vercel-friendly, with one optional
serverless function for AI label detection (see below).

## Stack

Vite + React 18 + TypeScript · Tailwind CSS · `pdf-lib` · `react-dropzone` · `uuid`

## Develop

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm test         # run placement unit tests
npm run build    # typecheck + production build to dist/
```

## How it works

`src/lib/placement.ts` holds `placeInQuadrant(image, margin)` — the single
source of truth for image geometry (mm, top-left origin). Both the SVG preview
(`SheetPreview`) and the PDF exporter (`src/lib/pdf.ts`) consume it, so the
on-screen preview and the printed PDF are pixel-for-pixel equivalent. The PDF
helper `pdfDrawParams` converts a placement into pdf-lib's bottom-left anchor +
rotation so 90/180/270° rotations land exactly on center.

## Automatic label detection

When you upload a PDF/image that contains a shipping label alongside other
content (instructions, invoices, …), the crop editor asks a vision model to
locate the label and pre-fills the crop frame for you — it snaps automatically
only if you haven't started adjusting, and you always confirm before it's used.
If detection is unavailable or finds nothing, cropping works exactly as before.

The browser calls `POST /api/detect-label` (a Vercel serverless function); the
function proxies to any **OpenAI-compatible** vision endpoint so no API key ever
reaches the client. Configure it with env vars (see `.env.example`):

| Var | Notes |
| --- | --- |
| `VISION_BASE_URL` | OpenAI-compatible base URL |
| `VISION_MODEL` | Model id (must be exact) |
| `VISION_API_KEY` | API key; required by hosted endpoints, ignored by LM Studio |

**Default — Gemini (hosted, cheap, fast):** the cheapest vision tier,
`gemini-2.5-flash-lite`, costs ~$0.0002/label and responds in ~1–2s. Get a key
at [Google AI Studio](https://aistudio.google.com/apikey) and set:

```
VISION_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
VISION_MODEL=gemini-2.5-flash-lite
VISION_API_KEY=<your key>
```

**Alternative — local LM Studio (offline, no key):** load a vision-capable model,
start its server, and point `VISION_BASE_URL=http://localhost:1234/v1` with
`VISION_MODEL` set to the exact id from its panel. Reasoning models work (the
function allots enough tokens to think first) but are slower (~30s on a local 26B).

Either way, `pnpm dev` serves `/api/detect-label` from the same code as
production (no `vercel dev` needed); for deployment, set the three vars in the
Vercel project. Detection logic is unit-tested in `api/_detectLabelCore.test.ts`.

## Printing

Export the PDF, then print at **100% / Actual size** (never "Fit to page"),
A4 paper, no margins. Use **Generate calibration sheet** to verify your
printer's alignment against a ruler before committing a label sheet.

## Geometry

- Page: A4, 210 × 297 mm, portrait
- Cells: 2×2, each 105 × 148.5 mm, no gutters
  - Q1 (0, 0) · Q2 (105, 0) · Q3 (0, 148.5) · Q4 (105, 148.5)
- Image px → mm assumes 96 DPI source
- Default safety margin: 2 mm (configurable)

## V1 scope

PNG/JPG input · one image per quadrant · `contain` fit (+ rotation, offset,
margin) · single sheet · calibration sheet generator. PDF input, cover/stretch
fit, multi-sheet batches, and other layouts are out of scope.
