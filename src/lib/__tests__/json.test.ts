import { describe, it, expect } from "vitest";
import { safeParseJson } from "../json";

describe("safeParseJson", () => {
  it("parses a valid JSON string", () => {
    expect(safeParseJson('["Lugh", "Samildánach"]', [])).toEqual(["Lugh", "Samildánach"]);
  });

  it("returns fallback for null input", () => {
    expect(safeParseJson(null, [])).toEqual([]);
  });

  it("returns fallback for empty string", () => {
    expect(safeParseJson("", [])).toEqual([]);
  });

  it("returns fallback for invalid JSON", () => {
    expect(safeParseJson("{broken", null)).toBeNull();
  });

  it("parses a JSON object", () => {
    expect(safeParseJson('{"key":"value"}', {})).toEqual({ key: "value" });
  });

  it("preserves fallback type when input is null", () => {
    const result = safeParseJson<string[]>(null, ["fallback"]);
    expect(result).toEqual(["fallback"]);
  });
});
