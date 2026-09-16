import { maskIdentifier } from "./mask-identifier";

describe("maskIdentifier", () => {
  it("masks the local part of an email, keeping first and last chars", () => {
    expect(maskIdentifier("john@example.com")).toBe("j**n@example.com");
    expect(maskIdentifier("ab@x.io")).toBe("a*b@x.io");
  });

  it("handles single-character local part", () => {
    expect(maskIdentifier("a@x.io")).toBe("a*@x.io");
  });

  it("masks the middle of a phone number", () => {
    expect(maskIdentifier("2348012345678")).toBe("234********78");
  });

  it("handles short values", () => {
    expect(maskIdentifier("ab")).toBe("a*");
    expect(maskIdentifier("12345")).toBe("123*45");
  });

  it("returns empty input unchanged", () => {
    expect(maskIdentifier("  ")).toBe("");
  });
});