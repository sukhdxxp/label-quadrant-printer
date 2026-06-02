import { describe, it, expect } from "vitest";
import { isPdf, isImage } from "./fileLoading";

const file = (type: string) => new File([], "x", { type });

describe("isPdf", () => {
  it("matches application/pdf only", () => {
    expect(isPdf(file("application/pdf"))).toBe(true);
    expect(isPdf(file("image/png"))).toBe(false);
    expect(isPdf(file(""))).toBe(false);
  });
});

describe("isImage", () => {
  it("matches any image/* type", () => {
    expect(isImage(file("image/png"))).toBe(true);
    expect(isImage(file("image/jpeg"))).toBe(true);
    expect(isImage(file("image/webp"))).toBe(true);
    expect(isImage(file("application/pdf"))).toBe(false);
  });
});
