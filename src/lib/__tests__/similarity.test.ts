import { describe, it, expect } from "vitest";
import { levenshtein, similarity } from "../similarity";

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("cú chulainn", "cú chulainn")).toBe(0);
  });

  it("returns string length when the other string is empty", () => {
    expect(levenshtein("lugh", "")).toBe(4);
    expect(levenshtein("", "lugh")).toBe(4);
  });

  it("counts single insertion", () => {
    expect(levenshtein("cat", "cats")).toBe(1);
  });

  it("counts single deletion", () => {
    expect(levenshtein("cats", "cat")).toBe(1);
  });

  it("counts single substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("handles multi-character edits", () => {
    expect(levenshtein("lugh", "lug")).toBe(1);
    expect(levenshtein("fionn", "finn")).toBe(1);
    expect(levenshtein("dagda", "dagde")).toBe(1);
  });

  it("handles completely different strings", () => {
    expect(levenshtein("abc", "xyz")).toBe(3);
  });

  it("handles both empty strings", () => {
    expect(levenshtein("", "")).toBe(0);
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("Lugh", "Lugh")).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(similarity("LUGH", "lugh")).toBe(1);
  });

  it("returns 0.85 for substring match", () => {
    expect(similarity("Lugh Lámhfhada", "Lugh")).toBe(0.85);
    expect(similarity("Lugh", "Lugh Lámhfhada")).toBe(0.85);
  });

  it("returns score between 0 and 1 for near-but-not-substring match", () => {
    // 1 edit in 11 chars → 0.909, above the substring shortcut
    const s = similarity("Cú Chulainn", "Cu Chulainn");
    expect(s).toBeGreaterThan(0.8);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("returns a score between 0 and 1 for partial names", () => {
    const s = similarity("Fionn", "Finn");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("returns low score for completely different names", () => {
    const s = similarity("Dagda", "Balor");
    expect(s).toBeLessThan(0.5);
  });

  it("handles empty strings without crashing (both empty = 1)", () => {
    expect(similarity("", "")).toBe(1);
  });

  it("scores variant spellings of Morrígan above 0.6", () => {
    expect(similarity("Morrígan", "Morrigan")).toBeGreaterThan(0.6);
  });
});
