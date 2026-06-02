import { describe, it, expect } from "vitest";
import { rotateSize, computeBakeDims } from "./imageEditing";

describe("rotateSize", () => {
  it("keeps dimensions for 0° and 180°", () => {
    expect(rotateSize(400, 600, 0)).toEqual({ width: 400, height: 600 });
    expect(rotateSize(400, 600, 180)).toEqual({ width: 400, height: 600 });
  });

  it("swaps dimensions for 90° and 270°", () => {
    expect(rotateSize(400, 600, 90)).toEqual({ width: 600, height: 400 });
    expect(rotateSize(400, 600, 270)).toEqual({ width: 600, height: 400 });
  });
});

describe("computeBakeDims", () => {
  it("returns the rounded crop size (already in the rotated frame)", () => {
    expect(computeBakeDims({ x: 10, y: 20, width: 300.4, height: 450.6 })).toEqual(
      { width: 300, height: 451 },
    );
  });
});
