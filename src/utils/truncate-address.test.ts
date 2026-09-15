import { truncateCryptoAddress } from "./truncate-address";

describe("truncateCryptoAddress", () => {
  it("truncates a long address with default parameters", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateCryptoAddress(address)).toBe("0x12...5678");
  });

  it("returns the address unchanged when its length equals twice the visible chars", () => {
    expect(truncateCryptoAddress("abcdefgh")).toBe("abcdefgh");
  });

  it("returns the address unchanged when it is shorter than twice the visible chars", () => {
    expect(truncateCryptoAddress("abcd")).toBe("abcd");
    expect(truncateCryptoAddress("a")).toBe("a");
  });

  it("returns an empty string for an empty address", () => {
    expect(truncateCryptoAddress("")).toBe("");
  });

  it("respects a custom visibleChars count", () => {
    expect(truncateCryptoAddress("abcdefghi", 2)).toBe("ab...hi");
  });

  it("respects a custom separator", () => {
    expect(truncateCryptoAddress("abcdefghi", 4, "**")).toBe("abcd**fghi");
  });

  it("handles very long input", () => {
    const long = "x".repeat(1000);
    expect(truncateCryptoAddress(long)).toBe(
      "xxxx..." + "x".repeat(4)
    );
  });

  it("handles an address that is only slightly longer than the threshold", () => {
    expect(truncateCryptoAddress("abcdefghi")).toBe("abcd...fghi");
  });

  it("returns the address unchanged when visibleChars is zero and address is empty", () => {
    expect(truncateCryptoAddress("", 0)).toBe("");
  });

  it("throws a TypeError when address is null or undefined", () => {
    expect(() => truncateCryptoAddress(null as unknown as string)).toThrow(TypeError);
    expect(() => truncateCryptoAddress(undefined as unknown as string)).toThrow(TypeError);
  });
});