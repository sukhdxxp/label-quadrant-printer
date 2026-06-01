# Label Quadrant Printer

Client-side React app that places images into a chosen quadrant of an A4
TownStix 4-per-sheet label layout (105 × 148.5 mm cells), previews accurately,
and exports a print-ready A4 PDF. No backend — fully static, Vercel-friendly.

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
