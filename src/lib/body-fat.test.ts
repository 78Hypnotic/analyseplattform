import { describe, expect, it } from "vitest";
import { getBodyFatFallbackImageSrc, getBodyFatImageSrc, getBodyFatStatus } from "./body-fat";

describe("body fat image resolution", () => {
  it("uses the gender specific image set when no body type is selected", () => {
    expect(getBodyFatImageSrc("female", 26)).toBe("/bodyfat/bodyfat-female-3.png");
    expect(getBodyFatImageSrc("male", 8)).toBe("/bodyfat/bodyfat-male-1.png");
  });

  it("resolves body type specific images for the matching level", () => {
    expect(getBodyFatImageSrc("female", 26, "mesomorph")).toBe("/bodyfat/bodyfat-female-mesomorph-3.png");
    expect(getBodyFatImageSrc("male", 32, "endomorph")).toBe("/bodyfat/bodyfat-male-endomorph-5.png");
  });

  it("keeps a fallback image for every value", () => {
    expect(getBodyFatFallbackImageSrc("male", 26)).toBe("/bodyfat/bodyfat-male-4.png");
    expect(getBodyFatFallbackImageSrc("female", null)).toBe("/bodyfat/bodyfat-female-3.png");
  });

  it("keeps status thresholds independent of the body type", () => {
    expect(getBodyFatStatus("female", 14)).toBe("Athletisch");
    expect(getBodyFatStatus("male", 26)).toBe("Erhöht");
  });
});
