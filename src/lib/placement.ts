import type { LabelImage, Placement, Quadrant, Rotation } from "../types";

// ---------------------------------------------------------------------------
// Page + cell geometry (millimetres, top-left origin)
// ---------------------------------------------------------------------------

export const PAGE_W_MM = 210;
export const PAGE_H_MM = 297;
export const CELL_W_MM = 105;
export const CELL_H_MM = 148.5;

/** Assumed source DPI for converting image pixels to millimetres. */
export const PX_PER_MM = 96 / 25.4; // ≈ 3.7795275591

/** Points-per-millimetre for PDF generation (1 pt = 1/72 inch). */
export const PT_PER_MM = 72 / 25.4; // ≈ 2.8346456693
export const mmToPt = (mm: number): number => mm * PT_PER_MM;

export const pxToMm = (px: number): number => px / PX_PER_MM;

/** Top-left origin of each quadrant cell, in mm. */
export const QUADRANT_ORIGIN: Record<Quadrant, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: CELL_W_MM, y: 0 },
  3: { x: 0, y: CELL_H_MM },
  4: { x: CELL_W_MM, y: CELL_H_MM },
};

const isRotatedSideways = (r: Rotation): boolean => r === 90 || r === 270;

// Direction used when a landscape crop is turned upright into the portrait cell.
// 90° vs 270° fill the cell identically, so the choice is purely about which way
// is right-side-up. Carrier "label + instructions" PDFs print the label sideways
// with its top toward the page's left edge, so a quarter-turn counter-clockwise
// (270° in this app's clockwise-positive convention) lands it upright. It's a
// best-effort default — if a given label comes out inverted, one tap of the
// Rotate control flips it.
const FIT_ROTATION: Rotation = 270;

/**
 * Pick the orientation (0° or {@link FIT_ROTATION}) that lets an image of the
 * given pixel size fill more of a cell under contain-fit — i.e. auto-rotate a
 * landscape crop into the portrait cell when that prints it bigger. Returns 0 on
 * ties so normal portrait labels are never rotated. `margin` is the safety
 * margin in mm.
 */
export function bestFitRotation(
  naturalWidth: number,
  naturalHeight: number,
  margin: number,
): Rotation {
  if (naturalWidth <= 0 || naturalHeight <= 0) return 0;
  const uw = CELL_W_MM - 2 * margin;
  const uh = CELL_H_MM - 2 * margin;
  const iw = pxToMm(naturalWidth);
  const ih = pxToMm(naturalHeight);
  const scale0 = Math.min(uw / iw, uh / ih);
  const scale90 = Math.min(uw / ih, uh / iw);
  return scale90 > scale0 ? FIT_ROTATION : 0;
}

// ---------------------------------------------------------------------------
// Core placement — the single source of truth used by both the SVG preview
// and PDF export. Given an image and the global safety margin, compute where
// the image lands inside its quadrant cell.
// ---------------------------------------------------------------------------

export function placeInQuadrant(image: LabelImage, margin: number): Placement {
  const cell = QUADRANT_ORIGIN[image.quadrant];

  // 1. image natural size in mm (assume 96 DPI source)
  const iwMm = pxToMm(image.naturalWidth);
  const ihMm = pxToMm(image.naturalHeight);

  // 2. for 90/270 the footprint dims swap when fitting into the cell
  const sideways = isRotatedSideways(image.rotation);
  const footprintNatW = sideways ? ihMm : iwMm;
  const footprintNatH = sideways ? iwMm : ihMm;

  // 3. usable area inside the safety margin
  const uw = CELL_W_MM - 2 * margin;
  const uh = CELL_H_MM - 2 * margin;

  // 4. contain scale — default allows upscaling so small labels fill the cell
  const scale = Math.min(uw / footprintNatW, uh / footprintNatH);

  // 5. footprint (rotated bounding box) and un-rotated content size
  const w = footprintNatW * scale;
  const h = footprintNatH * scale;
  const contentW = iwMm * scale;
  const contentH = ihMm * scale;

  // 6. center the footprint in the usable area, then apply fine-tune offsets
  const x = cell.x + margin + (uw - w) / 2 + image.offsetX;
  const y = cell.y + margin + (uh - h) / 2 + image.offsetY;

  return { x, y, w, h, rotation: image.rotation, contentW, contentH };
}

/**
 * pdf-lib draws an image from its bottom-left anchor and rotates it
 * counter-clockwise about that anchor. Given a placement (footprint in
 * top-left page coords) compute the bottom-left anchor in pdf coords
 * (y-up) so the rotated image lands exactly inside the footprint.
 */
export function pdfDrawParams(p: Placement): {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
} {
  // footprint center, page coords (top-left origin)
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;

  // center in pdf coords (y-up, origin bottom-left)
  const cxPdf = cx;
  const cyPdf = PAGE_H_MM - cy;

  const halfW = p.contentW / 2;
  const halfH = p.contentH / 2;

  // anchor = center - R(θ) · (halfW, halfH), R = CCW rotation
  let ax: number;
  let ay: number;
  switch (p.rotation) {
    case 90:
      ax = cxPdf + halfH;
      ay = cyPdf - halfW;
      break;
    case 180:
      ax = cxPdf + halfW;
      ay = cyPdf + halfH;
      break;
    case 270:
      ax = cxPdf - halfH;
      ay = cyPdf + halfW;
      break;
    case 0:
    default:
      ax = cxPdf - halfW;
      ay = cyPdf - halfH;
      break;
  }

  return {
    x: ax,
    y: ay,
    width: p.contentW,
    height: p.contentH,
    rotation: p.rotation,
  };
}
