import {
  normalizeKycStatus,
  isKycApproved,
  getKycAccessToken,
} from "./normalize-kyc-status";

describe("normalizeKycStatus", () => {
  it("passes through null, undefined, and non-object values", () => {
    expect(normalizeKycStatus(null)).toBeNull();
    expect(normalizeKycStatus(undefined)).toBeUndefined();
    expect(normalizeKycStatus("nope" as never)).toBe("nope");
  });

  it("defaults an empty response to not_submitted", () => {
    const result = normalizeKycStatus({});
    expect(result.status).toBe("not_submitted");
    expect(result.kycStatus).toBe("not_submitted");
    expect(result.verified).toBe(false);
    expect(result.isIDverified).toBe(false);
    expect(result.reason).toBe("");
    expect(result.submittedAt).toBe("");
  });

  it("normalizes status from the top-level status field", () => {
    const result = normalizeKycStatus({ status: "approved" });
    expect(result.status).toBe("approved");
    expect(result.verified).toBe(true);
    expect(result.isIDverified).toBe(true);
  });

  it("normalizes status case-insensitively", () => {
    const result = normalizeKycStatus({ kycStatus: "APPROVED" });
    expect(result.status).toBe("approved");
    expect(result.verified).toBe(true);
  });

  it("reads status from alternate kyc fields", () => {
    expect(normalizeKycStatus({ kyc_status: "pending" }).status).toBe("pending");
    expect(normalizeKycStatus({ reviewStatus: "verified" }).status).toBe("verified");
    expect(normalizeKycStatus({ review_status: "rejected" }).status).toBe("rejected");
    expect(normalizeKycStatus({ applicantStatus: "approved" }).status).toBe("approved");
    expect(normalizeKycStatus({ applicant_status: "verified" }).status).toBe("verified");
  });

  it("derives approved from verified flags", () => {
    expect(normalizeKycStatus({ verified: true }).status).toBe("approved");
    expect(normalizeKycStatus({ isVerified: true }).status).toBe("approved");
    expect(normalizeKycStatus({ isIDverified: true }).status).toBe("approved");
    expect(normalizeKycStatus({ verified: false }).status).toBe("not_submitted");
  });

  it("reads the reason from alternate rejection fields", () => {
    const result = normalizeKycStatus({ rejection_reason: "docs unclear", status: "rejected" });
    expect(result.reason).toBe("docs unclear");
    expect(result.rejectionReason).toBe("docs unclear");

    const nested = normalizeKycStatus({
      reviewResult: { reviewRejectType: "FakeDocument" },
      review_status: "rejected",
    });
    expect(nested.reason).toBe("FakeDocument");
  });

  it("reads submittedAt from alternate timestamp fields", () => {
    expect(normalizeKycStatus({ submitted_at: "2024-01-01", status: "pending" }).submittedAt).toBe(
      "2024-01-01"
    );
    expect(normalizeKycStatus({ createdAt: "2024-02-02" }).submittedAt).toBe("2024-02-02");
    expect(normalizeKycStatus({ created_at: "2024-03-03" }).submittedAt).toBe("2024-03-03");
  });

  it("prefers nested response.data over the top-level response", () => {
    const result = normalizeKycStatus({ status: "approved", data: { status: "pending" } });
    expect(result.status).toBe("pending");
  });

  it("falls back to the top-level response when data is not an object", () => {
    const result = normalizeKycStatus({ status: "approved", data: "bad" });
    expect(result.status).toBe("approved");
  });

  it("merges normalized fields into the response data object", () => {
    const result = normalizeKycStatus({ data: { extra: 1, status: "approved" } });
    expect(result.data.extra).toBe(1);
    expect(result.data.status).toBe("approved");
    expect(result.data.kycStatus).toBe("approved");
    expect(result.data.verified).toBe(true);
    expect(result.data.reason).toBe("");
  });

  it("mirrors normalized values on both the top level and the data object", () => {
    const result = normalizeKycStatus({ status: "approved", reason: "ok" });
    expect(result.kycStatus).toBe("approved");
    expect(result.verified).toBe(true);
    expect(result.reason).toBe("ok");
    expect(result.data.status).toBe("approved");
    expect(result.data.reason).toBe("ok");
  });
});

describe("isKycApproved", () => {
  it("returns true for approved and verified statuses", () => {
    expect(isKycApproved("approved")).toBe(true);
    expect(isKycApproved("verified")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isKycApproved("APPROVED")).toBe(true);
    expect(isKycApproved("Verified")).toBe(true);
  });

  it("returns false for null, undefined, and empty statuses", () => {
    expect(isKycApproved(null)).toBe(false);
    expect(isKycApproved(undefined)).toBe(false);
    expect(isKycApproved("")).toBe(false);
  });

  it("returns false for other statuses", () => {
    expect(isKycApproved("pending")).toBe(false);
    expect(isKycApproved("rejected")).toBe(false);
    expect(isKycApproved("not_submitted")).toBe(false);
  });
});

describe("getKycAccessToken", () => {
  it("returns an empty string for null, undefined, and non-object values", () => {
    expect(getKycAccessToken(null)).toBe("");
    expect(getKycAccessToken(undefined)).toBe("");
    expect(getKycAccessToken("string" as never)).toBe("");
    expect(getKycAccessToken(42 as never)).toBe("");
  });

  it("reads the token from the response top level", () => {
    expect(getKycAccessToken({ accessToken: "abc" })).toBe("abc");
    expect(getKycAccessToken({ token: "tok" })).toBe("tok");
    expect(getKycAccessToken({ sessionToken: "sess" })).toBe("sess");
    expect(getKycAccessToken({ sdkToken: "sdk" })).toBe("sdk");
    expect(getKycAccessToken({ sumsubToken: "sum" })).toBe("sum");
  });

  it("reads the token from a nested data object", () => {
    expect(getKycAccessToken({ data: { accessToken: "abc" } })).toBe("abc");
    expect(getKycAccessToken({ data: { token: "tok" } })).toBe("tok");
    expect(getKycAccessToken({ data: { sessionToken: "sess" } })).toBe("sess");
  });

  it("prefers top-level tokens over nested tokens", () => {
    expect(getKycAccessToken({ accessToken: "top", data: { token: "nested" } })).toBe("top");
  });

  it("returns an empty string when the token is not a string", () => {
    expect(getKycAccessToken({ accessToken: 123 })).toBe("");
    expect(getKycAccessToken({ data: { token: {} } })).toBe("");
  });

  it("returns an empty string when no token is present", () => {
    expect(getKycAccessToken({})).toBe("");
    expect(getKycAccessToken({ data: {} })).toBe("");
  });
});