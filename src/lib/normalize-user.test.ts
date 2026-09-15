import { normalizeUser } from "./normalize-user";

describe("normalizeUser", () => {
  it("passes through null and undefined", () => {
    expect(normalizeUser(null)).toBeNull();
    expect(normalizeUser(undefined)).toBeUndefined();
  });

  it("passes through non-object values", () => {
    expect(normalizeUser("not-an-object" as never)).toBe("not-an-object");
    expect(normalizeUser(42 as never)).toBe(42);
    expect(normalizeUser(true as never)).toBe(true);
  });

  it("produces safe defaults for an empty object", () => {
    const result = normalizeUser({});
    expect(result).toEqual({
      firstName: "",
      lastName: "",
      isVerified: false,
      isIDverified: false,
      kycStatus: "not_submitted",
      twoFaEnabled: false,
      isFuturesAccepted: false,
    });
  });

  it("maps snake_case fields onto their camelCase equivalents", () => {
    const result = normalizeUser({
      first_name: "John",
      last_name: "Doe",
      is_verified: true,
      is_id_verified: true,
      kyc_status: "approved",
      two_factor_enabled: true,
      isFutures_accepted: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        firstName: "John",
        lastName: "Doe",
        isVerified: true,
        isIDverified: true,
        kycStatus: "approved",
        twoFaEnabled: true,
        isFuturesAccepted: true,
      })
    );
  });

  it("prefers camelCase keys over snake_case keys", () => {
    const result = normalizeUser({
      firstName: "Jack",
      first_name: "John",
      kycStatus: "pending",
      kyc_status: "approved",
      twoFaEnabled: false,
      two_fa_enabled: true,
      isVerified: false,
      is_verified: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        firstName: "Jack",
        kycStatus: "pending",
        twoFaEnabled: false,
        isVerified: false,
      })
    );
  });

  it("treats an explicitly empty string as the value", () => {
    const result = normalizeUser({
      firstName: "",
      first_name: "John",
    });
    expect(result.firstName).toBe("");
  });

  it("marks the user as ID-verified from boolean kycStatus values", () => {
    expect(normalizeUser({ kyc_status: true }).isIDverified).toBe(true);
    expect(normalizeUser({ kycStatus: true }).isIDverified).toBe(true);
    expect(normalizeUser({ isIDverified: true }).isIDverified).toBe(true);
    expect(normalizeUser({ is_id_verified: true }).isIDverified).toBe(true);
  });

  it("marks the user as ID-verified from approved and verified kyc strings", () => {
    expect(normalizeUser({ kycStatus: "approved" }).isIDverified).toBe(true);
    expect(normalizeUser({ kyc_status: "APPROVED" }).isIDverified).toBe(true);
    expect(normalizeUser({ kycStatus: "Verified" }).isIDverified).toBe(true);
    expect(normalizeUser({ kyc_status: "verified" }).isIDverified).toBe(true);
  });

  it("does not mark the user as ID-verified for other kyc statuses", () => {
    expect(normalizeUser({ kycStatus: "pending" }).isIDverified).toBe(false);
    expect(normalizeUser({ kyc_status: "rejected" }).isIDverified).toBe(false);
  });

  it("derives an approved kycStatus when no status is given but the user is verified", () => {
    const result = normalizeUser({ isIDverified: true });
    expect(result.isIDverified).toBe(true);
    expect(result.kycStatus).toBe("approved");
  });

  it("keeps an explicit non-boolean kycStatus value", () => {
    expect(normalizeUser({ kycStatus: "pending" }).kycStatus).toBe("pending");
    expect(normalizeUser({ kyc_status: "PENDING" }).kycStatus).toBe("PENDING");
  });

  it("preserves unrelated fields", () => {
    const result = normalizeUser({ id: 42, email: "a@b.c", nested: { x: 1 } });
    expect(result.id).toBe(42);
    expect(result.email).toBe("a@b.c");
    expect(result.nested).toEqual({ x: 1 });
  });

  it("does not mutate the input object", () => {
    const input = { first_name: "John", is_verified: true, nested: { keep: true } };
    normalizeUser(input);
    expect(input).toEqual({ first_name: "John", is_verified: true, nested: { keep: true } });
  });
});