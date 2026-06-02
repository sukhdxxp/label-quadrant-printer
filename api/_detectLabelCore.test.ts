import { describe, it, expect } from "vitest";
import {
  extractJsonObject,
  normalizeBox,
  clampBox,
  resolveConfig,
} from "./_detectLabelCore";

describe("extractJsonObject", () => {
  it("parses a bare object", () => {
    expect(extractJsonObject('{"x":0.1,"y":0.2,"width":0.3,"height":0.4}')).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    });
  });

  it("parses an object wrapped in prose", () => {
    const text = 'Here is the label box: {"x":0.1,"y":0.2,"width":0.3,"height":0.4}. Done.';
    expect(extractJsonObject(text)).toEqual({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 });
  });

  it("parses a fenced code block", () => {
    const text = "```json\n{\"label\":false}\n```";
    expect(extractJsonObject(text)).toEqual({ label: false });
  });

  it("returns null when no JSON is present", () => {
    expect(extractJsonObject("no idea, sorry")).toBeNull();
  });
});

describe("normalizeBox", () => {
  it("accepts 0..1 fractions as-is", () => {
    expect(normalizeBox({ x: 0.1, y: 0.2, width: 0.5, height: 0.6 })).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.6,
    });
  });

  it("rescales a 0..1000 integer answer", () => {
    expect(normalizeBox({ x: 100, y: 200, width: 500, height: 600 })).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.6,
    });
  });

  it("handles a mixed-scale answer (fractions on one axis, 0..1000 on the other)", () => {
    // Observed from Gemma 4: x/width as fractions, y/height on a 0..1000 scale.
    const box = normalizeBox({ x: 0, y: 86, width: 1, height: 327 })!;
    expect(box.x).toBeCloseTo(0);
    expect(box.width).toBeCloseTo(1);
    expect(box.y).toBeCloseTo(0.086);
    expect(box.height).toBeCloseTo(0.327);
  });

  it("normalises raw pixels using image dimensions", () => {
    const box = normalizeBox({ x: 200, y: 400, width: 1000, height: 1200 }, 2000, 2000);
    expect(box).toEqual({ x: 0.1, y: 0.2, width: 0.5, height: 0.6 });
  });

  it("rejects pixels when dimensions are unknown", () => {
    expect(normalizeBox({ x: 200, y: 400, width: 1500, height: 1800 })).toBeNull();
  });

  it("converts corner form {x1,y1,x2,y2}", () => {
    expect(normalizeBox({ x1: 0.1, y1: 0.2, x2: 0.6, y2: 0.8 })).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.6000000000000001,
    });
  });

  it("converts {left,top,right,bottom}", () => {
    expect(normalizeBox({ left: 100, top: 100, right: 600, bottom: 700 })).toEqual({
      x: 0.1,
      y: 0.1,
      width: 0.5,
      height: 0.6,
    });
  });

  it("accepts an [x,y,w,h] array", () => {
    expect(normalizeBox({ box: [0.1, 0.2, 0.5, 0.6] })).toEqual({
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.6,
    });
  });

  it("returns null for {label:false}", () => {
    expect(normalizeBox({ label: false })).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(normalizeBox({ x: 0.1 })).toBeNull();
    expect(normalizeBox("nope")).toBeNull();
    expect(normalizeBox(null)).toBeNull();
  });

  it("rejects degenerate (zero/negative) sizes", () => {
    expect(normalizeBox({ x: 0.1, y: 0.1, width: 0, height: 0.5 })).toBeNull();
  });
});

describe("clampBox", () => {
  it("clamps a box that overflows the image", () => {
    const box = clampBox({ x: 0.8, y: 0.8, width: 0.5, height: 0.5 })!;
    expect(box.x).toBeCloseTo(0.8);
    expect(box.y).toBeCloseTo(0.8);
    expect(box.width).toBeCloseTo(0.2);
    expect(box.height).toBeCloseTo(0.2);
  });

  it("rejects slivers", () => {
    expect(clampBox({ x: 0, y: 0, width: 0.01, height: 0.5 })).toBeNull();
  });
});

describe("resolveConfig", () => {
  it("defaults to local LM Studio", () => {
    const cfg = resolveConfig({});
    expect(cfg.baseUrl).toBe("http://localhost:1234/v1");
    expect(cfg.model).toBe("local-model");
    expect(cfg.apiKey).toBeUndefined();
  });

  it("reads overrides from env", () => {
    const cfg = resolveConfig({
      VISION_BASE_URL: "https://api.example.com/v1/",
      VISION_MODEL: "gemma-3-12b",
      VISION_API_KEY: "sk-test",
    });
    expect(cfg).toEqual({
      baseUrl: "https://api.example.com/v1/",
      model: "gemma-3-12b",
      apiKey: "sk-test",
    });
  });
});
