import { truncateEmail } from "./truncate-email";

describe("truncateEmail", () => {
  it("returns an empty string for null, undefined, and empty input", () => {
    expect(truncateEmail(null)).toBe("");
    expect(truncateEmail(undefined)).toBe("");
    expect(truncateEmail("")).toBe("");
  });

  it("keeps the first 2 characters when the local part is 4 characters or fewer", () => {
    expect(truncateEmail("ab@example.com")).toBe("ab***@example.com");
    expect(truncateEmail("abcd@example.com")).toBe("ab***@example.com");
  });

  it("keeps the first 4 characters when the local part exceeds 4 characters", () => {
    expect(truncateEmail("john.doe@example.com")).toBe("john***@example.com");
    expect(truncateEmail("abcde@example.com")).toBe("abcd***@example.com");
  });

  it("handles the boundary between 4 and 5 character local parts", () => {
    expect(truncateEmail("abcd@example.com")).toBe("ab***@example.com");
    expect(truncateEmail("abcde@example.com")).toBe("abcd***@example.com");
  });

  it("handles very long local parts", () => {
    const local = "a".repeat(100);
    expect(truncateEmail(`${local}@example.com`)).toBe("aaaa***@example.com");
  });

  it("preserves the domain part including subdomains", () => {
    expect(truncateEmail("user@mail.example.co.uk")).toBe("us***@mail.example.co.uk");
  });
});