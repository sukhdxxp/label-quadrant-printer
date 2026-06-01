import { describe, it, expect } from "vitest";
import {
  placeInQuadrant,
  pdfDrawParams,
  pxToMm,
  CELL_W_MM,
  CELL_H_MM,
  PAGE_H_MM,
  QUADRANT_ORIGIN,
} from "./placement";
import type { LabelImage, Quadrant, Rotation } from "../types";

function makeImage(overrides: Partial<LabelImage> = {}): LabelImage {
  return {
    id: "test",
    quadrant: 1,
    file: new File([], "x.png", { type: "image/png" }),
    dataUrl: "",
    naturalWidth: 396, // ~104.8mm at 96dpi
    naturalHeight: 561, // ~148.4mm at 96dpi
    fit: "contain",
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    ...overrides,
  };
}

const approx = (a: number, b: number, eps = 1e-6) =>
  expect(Math.abs(a - b)).toBeLessThan(eps);

describe("placeInQuadrant", () => {
  it("places an image inside the usable area with the default margin", () => {
    const img = makeImage({ quadrant: 1 });
    const margin = 2;
    const p = placeInQuadrant(img, margin);
    // footprint must sit inside the cell's usable area
    expect(p.x).toBeGreaterThanOrEqual(margin - 1e-9);
    expect(p.y).toBeGreaterThanOrEqual(margin - 1e-9);
    expect(p.x + p.w).toBeLessThanOrEqual(CELL_W_MM - margin + 1e-9);
    expect(p.y + p.h).toBeLessThanOrEqual(CELL_H_MM - margin + 1e-9);
  });

  it("preserves aspect ratio (contain)", () => {
    const img = makeImage();
    const p = placeInQuadrant(img, 0);
    const srcAspect = img.naturalWidth / img.naturalHeight;
    approx(p.w / p.h, srcAspect, 1e-9);
  });

  it("centers a full-bleed image exactly with zero margin", () => {
    // square-ish image that fits height, centered horizontally
    const img = makeImage({ naturalWidth: 396, naturalHeight: 561 });
    const p = placeInQuadrant(img, 0);
    const iwMm = pxToMm(396);
    const ihMm = pxToMm(561);
    const scale = Math.min(CELL_W_MM / iwMm, CELL_H_MM / ihMm);
    const w = iwMm * scale;
    const h = ihMm * scale;
    approx(p.x, (CELL_W_MM - w) / 2);
    approx(p.y, (CELL_H_MM - h) / 2);
  });

  it("offsets shift the footprint by exactly the given mm", () => {
    const base = placeInQuadrant(makeImage(), 2);
    const shifted = placeInQuadrant(
      makeImage({ offsetX: 3, offsetY: -4 }),
      2,
    );
    approx(shifted.x - base.x, 3);
    approx(shifted.y - base.y, -4);
  });

  it("swaps footprint dims for 90/270 rotation", () => {
    const img0 = makeImage({ rotation: 0 });
    const img90 = makeImage({ rotation: 90 });
    const p0 = placeInQuadrant(img0, 0);
    const p90 = placeInQuadrant(img90, 0);
    // content size stays in image's own orientation, footprint is rotated
    // for a 90° rotation the footprint width comes from the image height
    expect(p90.w).not.toBeCloseTo(p0.w, 1);
    // content aspect preserved
    approx(p90.contentW / p90.contentH, img90.naturalWidth / img90.naturalHeight);
  });

  it("maps each quadrant to its cell origin", () => {
    ([1, 2, 3, 4] as Quadrant[]).forEach((q) => {
      const p = placeInQuadrant(makeImage({ quadrant: q }), 0);
      const origin = QUADRANT_ORIGIN[q];
      expect(p.x).toBeGreaterThanOrEqual(origin.x - 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(origin.y - 1e-9);
      expect(p.x).toBeLessThanOrEqual(origin.x + CELL_W_MM + 1e-9);
    });
  });
});

describe("pdfDrawParams", () => {
  it("keeps the image center fixed across all rotations", () => {
    ([0, 90, 180, 270] as Rotation[]).forEach((r) => {
      const img = makeImage({ rotation: r });
      const p = placeInQuadrant(img, 2);
      const params = pdfDrawParams(p);

      // recover center from anchor + R(θ)·(half) in pdf space
      const halfW = params.width / 2;
      const halfH = params.height / 2;
      let cx: number;
      let cy: number;
      switch (r) {
        case 90:
          cx = params.x - halfH;
          cy = params.y + halfW;
          break;
        case 180:
          cx = params.x - halfW;
          cy = params.y - halfH;
          break;
        case 270:
          cx = params.x + halfH;
          cy = params.y - halfW;
          break;
        default:
          cx = params.x + halfW;
          cy = params.y + halfH;
      }

      const expectedCx = p.x + p.w / 2;
      const expectedCy = PAGE_H_MM - (p.y + p.h / 2);
      approx(cx, expectedCx, 1e-6);
      approx(cy, expectedCy, 1e-6);
    });
  });

  it("passes un-rotated content dims to pdf-lib", () => {
    const img = makeImage({ rotation: 90 });
    const p = placeInQuadrant(img, 2);
    const params = pdfDrawParams(p);
    approx(params.width, p.contentW);
    approx(params.height, p.contentH);
  });
});
