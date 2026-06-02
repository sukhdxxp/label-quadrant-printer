import { PDFDocument, degrees, rgb } from "pdf-lib";
import type { SheetState } from "../types";
import {
  CELL_H_MM,
  CELL_W_MM,
  PAGE_H_MM,
  PAGE_W_MM,
  mmToPt,
  placeInQuadrant,
  pdfDrawParams,
} from "./placement";

export const BUILD_VERSION = "v1.0.0";

/** `labels-YYYYMMDD-HHmm.pdf`, local time. */
export function formatDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

export function exportFilename(d = new Date()): string {
  return `labels-${formatDate(d)}.pdf`;
}

/** Trigger a browser download of the given PDF bytes. */
export function download(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Open the browser's print dialog for the given PDF bytes without downloading.
 * The PDF is loaded into an offscreen iframe and printed from there; the iframe
 * is cleaned up once printing is done.
 */
export function printPdf(bytes: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";

    const cleanup = () => {
      URL.revokeObjectURL(url);
      iframe.remove();
    };

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) throw new Error("Could not open the document for printing.");
        win.focus();
        // Tidy up after the print dialog is dismissed.
        win.addEventListener("afterprint", () => {
          cleanup();
          resolve();
        });
        win.print();
        // Fallback cleanup if afterprint never fires (some browsers).
        setTimeout(resolve, 1000);
      } catch (e) {
        cleanup();
        reject(e instanceof Error ? e : new Error("Printing failed."));
      }
    };
    iframe.onerror = () => {
      cleanup();
      reject(new Error("Could not load the document for printing."));
    };

    iframe.src = url;
    document.body.appendChild(iframe);
  });
}

/** Build the labels PDF for the current sheet state. */
export async function generatePdf(state: SheetState): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([mmToPt(PAGE_W_MM), mmToPt(PAGE_H_MM)]);

  for (const img of state.images) {
    if (state.disabledQuadrants.includes(img.quadrant)) continue;

    const bytes = await img.file.arrayBuffer();
    const embedded =
      img.file.type === "image/png"
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);

    const placement = placeInQuadrant(img, state.safetyMargin);
    const dp = pdfDrawParams(placement);

    page.drawImage(embedded, {
      x: mmToPt(dp.x),
      y: mmToPt(dp.y),
      width: mmToPt(dp.width),
      height: mmToPt(dp.height),
      rotate: degrees(dp.rotation),
    });
  }

  return pdf.save();
}

/** A4 calibration sheet for verifying printer alignment at 100% scale. */
export async function generateCalibrationPdf(
  d = new Date(),
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([mmToPt(PAGE_W_MM), mmToPt(PAGE_H_MM)]);
  const font = await pdf.embedFont("Helvetica");

  const yUp = (yMm: number) => mmToPt(PAGE_H_MM - yMm);

  const vLine = (xMm: number, color: ReturnType<typeof rgb>, thickness: number) =>
    page.drawLine({
      start: { x: mmToPt(xMm), y: yUp(0) },
      end: { x: mmToPt(xMm), y: yUp(PAGE_H_MM) },
      thickness,
      color,
    });
  const hLine = (yMm: number, color: ReturnType<typeof rgb>, thickness: number) =>
    page.drawLine({
      start: { x: mmToPt(0), y: yUp(yMm) },
      end: { x: mmToPt(PAGE_W_MM), y: yUp(yMm) },
      thickness,
      color,
    });

  const lightGray = rgb(0.78, 0.78, 0.78);
  const darkGray = rgb(0.5, 0.5, 0.5);
  const black = rgb(0, 0, 0);
  const red = rgb(0.85, 0.1, 0.1);

  // 1 mm grid — 0.1pt light gray
  for (let x = 0; x <= PAGE_W_MM; x += 1) {
    if (x % 5 === 0) continue;
    vLine(x, lightGray, 0.1);
  }
  for (let y = 0; y <= PAGE_H_MM; y += 1) {
    if (y % 5 === 0) continue;
    hLine(y, lightGray, 0.1);
  }

  // 5 mm grid — 0.2pt darker gray
  for (let x = 0; x <= PAGE_W_MM; x += 5) {
    if (x % 10 === 0) continue;
    vLine(x, darkGray, 0.2);
  }
  for (let y = 0; y <= PAGE_H_MM; y += 5) {
    if (y % 10 === 0) continue;
    hLine(y, darkGray, 0.2);
  }

  // 10 mm grid — 0.4pt black, with labels
  for (let x = 0; x <= PAGE_W_MM; x += 10) {
    vLine(x, black, 0.4);
    page.drawText(String(x), {
      x: mmToPt(x) + 1.5,
      y: yUp(0) - 9,
      size: 5,
      font,
      color: black,
    });
  }
  for (let y = 0; y <= PAGE_H_MM; y += 10) {
    hLine(y, black, 0.4);
    page.drawText(String(y), {
      x: 2,
      y: yUp(y) - 1.5,
      size: 5,
      font,
      color: black,
    });
  }

  // Quadrant boundary lines at x=105 and y=148.5 — red dashed 0.5pt
  page.drawLine({
    start: { x: mmToPt(CELL_W_MM), y: yUp(0) },
    end: { x: mmToPt(CELL_W_MM), y: yUp(PAGE_H_MM) },
    thickness: 0.5,
    color: red,
    dashArray: [3, 3],
  });
  page.drawLine({
    start: { x: mmToPt(0), y: yUp(CELL_H_MM) },
    end: { x: mmToPt(PAGE_W_MM), y: yUp(CELL_H_MM) },
    thickness: 0.5,
    color: red,
    dashArray: [3, 3],
  });

  // 5 mm crosshairs at the four corners of each cell (die-cut corners)
  const xs = [0, CELL_W_MM, PAGE_W_MM];
  const ys = [0, CELL_H_MM, PAGE_H_MM];
  const arm = 2.5; // mm — total crosshair span 5mm
  for (const cxMm of xs) {
    for (const cyMm of ys) {
      const x0 = Math.max(0, cxMm - arm);
      const x1 = Math.min(PAGE_W_MM, cxMm + arm);
      const y0 = Math.max(0, cyMm - arm);
      const y1 = Math.min(PAGE_H_MM, cyMm + arm);
      page.drawLine({
        start: { x: mmToPt(x0), y: yUp(cyMm) },
        end: { x: mmToPt(x1), y: yUp(cyMm) },
        thickness: 0.6,
        color: red,
      });
      page.drawLine({
        start: { x: mmToPt(cxMm), y: yUp(y0) },
        end: { x: mmToPt(cxMm), y: yUp(y1) },
        thickness: 0.6,
        color: red,
      });
    }
  }

  // Title near the top
  page.drawText(
    "Calibration sheet — print at 100% on plain A4, measure with ruler",
    {
      x: mmToPt(12),
      y: yUp(8),
      size: 9,
      font,
      color: black,
    },
  );

  // Build date / version, bottom-right
  const footer = `4-up A4 (105 x 148.5mm)  ${BUILD_VERSION}  ${formatDate(d)}`;
  const footerWidth = font.widthOfTextAtSize(footer, 6);
  page.drawText(footer, {
    x: mmToPt(PAGE_W_MM) - footerWidth - 6,
    y: 6,
    size: 6,
    font,
    color: darkGray,
  });

  return pdf.save();
}
