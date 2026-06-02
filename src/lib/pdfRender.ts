/**
 * Render the first page of a PDF file to a PNG data URL, fully client-side.
 *
 * pdf.js is heavy (~hundreds of KB), so it is dynamically imported the first
 * time a PDF is actually dropped — keeping it out of the initial bundle.
 */

export interface RenderedPdfPage {
  dataUrl: string;
  width: number;
  height: number;
}

/** Cap the rasterised longest side so huge pages don't blow up the canvas. */
const MAX_LONGEST_SIDE_PX = 2000;

let workerReady = false;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    // Vite bundles the worker as a hashed module worker, version-locked to the
    // installed package.
    const Worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker"))
      .default;
    pdfjs.GlobalWorkerOptions.workerPort = new Worker();
    workerReady = true;
  }
  return pdfjs;
}

/** Render page 1 of a PDF file into a PNG data URL with its pixel dimensions. */
export async function renderPdfFirstPage(file: File): Promise<RenderedPdfPage> {
  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    const page = await doc.getPage(1);

    // Pick a scale that targets the cap on the page's longest side.
    const base = page.getViewport({ scale: 1 });
    const longest = Math.max(base.width, base.height);
    const scale = longest > 0 ? Math.min(MAX_LONGEST_SIDE_PX / longest, 4) : 1;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context for PDF render");

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    await loadingTask.destroy();
  }
}
