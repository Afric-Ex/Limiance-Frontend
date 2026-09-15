vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { auth, findAuthToken, stripBearer } from "./auth";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

const axiosResponse = (data: unknown, status = 200, headers: Record<string, string> = {}) => ({
  data,
  status,
  statusText: "OK",
  headers,
  config: {},
});

const loginData = {
  emailOrPhone: "user@example.com",
  password: "secret",
  rememberMe: true,
  userAgent: "vitest",
  lotNumber: "lt-1",
  captchaOutput: "cap-123",
  passToken: "gt-123",
  genTime: "1699999999999",
};

const loginBody = {
  emailOrPhone: "user@example.com",
  password: "secret",
  rememberMe: true,
  userAgent: "vitest",
  lotNumber: "lt-1",
  captchaOutput: "cap-123",
  passToken: "gt-123",
  genTime: "1699999999999",
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});

describe("stripBearer", () => {
  it("strips a Bearer prefix", () => {
    expect(stripBearer("Bearer abc123")).toBe("abc123");
    expect(stripBearer("bearer abc123")).toBe("abc123");
  });

  it("returns the trimmed value when no Bearer prefix exists", () => {
    expect(stripBearer("abc123")).toBe("abc123");
    expect(stripBearer("   abc123   ")).toBe("abc123");
  });

  it("returns the whitespace-trimmed prefix when Bearer is not at the start", () => {
    expect(stripBearer("  Bearer   x ")).toBe("Bearer   x");
  });

  it("returns null for empty/falsy input", () => {
    expect(stripBearer("")).toBeNull();
    expect(stripBearer(null)).toBeNull();
    expect(stripBearer(undefined)).toBeNull();
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(stripBearer("   ")).toBe("");
  });
});

describe("findAuthToken", () => {
  it("returns null for nullish, primitive and string inputs", () => {
    expect(findAuthToken(null)).toBeNull();
    expect(findAuthToken(undefined)).toBeNull();
    expect(findAuthToken("plain-string")).toBeNull();
    expect(findAuthToken(42)).toBeNull();
    expect(findAuthToken(true)).toBeNull();
    expect(findAuthToken(false)).toBeNull();
  });

  it("finds tokens under every preferred key", () => {
    expect(findAuthToken({ accessToken: "at" })).toBe("at");
    expect(findAuthToken({ authToken: "auth-t" })).toBe("auth-t");
    expect(findAuthToken({ token: "t" })).toBe("t");
    expect(findAuthToken({ jwt: "jwt-v" })).toBe("jwt-v");
    expect(findAuthToken({ authorization: "authz" })).toBe("authz");
  });

  it("strips a Bearer prefix from the found token", () => {
    expect(findAuthToken({ accessToken: "Bearer at" })).toBe("at");
    expect(findAuthToken({ jwt: "Bearer jj" })).toBe("jj");
    expect(findAuthToken({ authorization: "Bearer zz" })).toBe("zz");
  });

  it("normalizes separators and case in keys", () => {
    expect(findAuthToken({ "Access Token": "Bearer aa" })).toBe("aa");
    expect(findAuthToken({ access_token: "und" })).toBe("und");
    expect(findAuthToken({ "auth-token": "dash" })).toBe("dash");
  });

  it("finds a token in nested objects", () => {
    expect(findAuthToken({ user: { profile: { token: "nested-token" } } })).toBe("nested-token");
    expect(findAuthToken({ data: { result: { accessToken: "deep" } } })).toBe("deep");
    expect(findAuthToken({ a: { b: { c: { authorization: "Bearer deepz" } } } })).toBe("deepz");
  });

  it("returns the first matching preferred key in iteration order", () => {
    expect(findAuthToken({ token: "plain", accessToken: "preferred" })).toBe("plain");
    expect(findAuthToken({ jwt: "j", token: "t" })).toBe("j");
  });

  it("ignores refresh/session/captcha/pass/verify keys", () => {
    expect(findAuthToken({ refreshToken: "abc" })).toBeNull();
    expect(findAuthToken({ refresh_token: "abc" })).toBeNull();
    expect(findAuthToken({ sessionToken: "abc" })).toBeNull();
    expect(findAuthToken({ captchaToken: "abc" })).toBeNull();
    expect(findAuthToken({ password: "abc" })).toBeNull();
    expect(findAuthToken({ verify: "abc" })).toBeNull();
    expect(findAuthToken({ verificationToken: "abc" })).toBeNull();
  });

  it("skips preferred keys that also match an ignored key", () => {
    expect(findAuthToken({ access_refresh_token: "abc" })).toBeNull();
    expect(findAuthToken({ token_verify: "abc" })).toBeNull();
  });

  it("ignores non-string token values", () => {
    expect(findAuthToken({ token: "" })).toBeNull();
    expect(findAuthToken({ accessToken: 42 })).toBeNull();
    expect(findAuthToken({ token: ["arr"] })).toBeNull();
  });

  it("still recurses through ignored top-level keys to find nested tokens", () => {
    expect(findAuthToken({ refresh: { accessToken: "inner" } })).toBe("inner");
    expect(findAuthToken({ session: { user: { token: "inner2" } } })).toBe("inner2");
  });

  it("handles circular references without recursing forever", () => {
    const circular: any = {};
    circular.self = circular;
    circular.meta = { name: "x" };
    circular.meta.self = circular;
    expect(findAuthToken(circular)).toBeNull();

    const withToken: any = {};
    withToken.next = withToken;
    withToken.next.accessToken = "circled";
    expect(findAuthToken(withToken)).toBe("circled");
  });
});

describe("auth.register", () => {
  const registerData = {
    email: "a@b.com",
    phone: "1234567",
    password: "pw",
    confirmPassword: "pw",
    firstName: "Ada",
    lastName: "Lovelace",
    username: "ada",
    country: "GB",
  };

  it("posts the payload and resolves with the response", async () => {
    const response = axiosResponse({ statusCode: 200, success: true, message: "registered" });
    mockPost.mockResolvedValueOnce(response);
    const result = await auth.register(registerData);
    expect(mockPost).toHaveBeenCalledWith("users/register", registerData);
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("network down"));
    await expect(auth.register(registerData)).rejects.toThrow("network down");
  });
});

describe("auth.login", () => {
  it("posts the login payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await auth.login(loginData);
    expect(mockPost).toHaveBeenCalledWith("users/login", loginBody);
  });

  it("injects accessToken from the nested data payload", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ statusCode: 200, data: { accessToken: "nested-token", success: true } })
    );
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("nested-token");
  });

  it("injects accessToken from payload.data.token", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ data: { token: "dt" } }));
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("dt");
  });

  it("injects accessToken from an access_token key", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ access_token: "under-token" }));
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("under-token");
  });

  it("prefers an existing top-level accessToken", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ accessToken: "top-token" }, 200, { authorization: "Bearer header-token" })
    );
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("top-token");
  });

  it("falls back to the authorization header when the payload has no token", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ success: true }, 200, { authorization: "Bearer header-token" })
    );
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("header-token");
  });

  it("falls back to the uppercase Authorization header", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ success: true }, 200, { Authorization: "Bearer cap-header" })
    );
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("cap-header");
  });

  it("falls back to x-user-access-token header keys", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ success: true }, 200, { "x-user-access-token": "Bearer uat2" })
    );
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("uat2");
  });

  it("falls back to x-auth-token header key", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ success: true }, 200, { "x-auth-token": "Bearer atok" })
    );
    const result = await auth.login(loginData);
    expect(result.data.accessToken).toBe("atok");
  });

  it("normalizes the user object in response.data.data", async () => {
    const rawUser = {
      first_name: "Sarah",
      last_name: "Lee",
      is_verified: true,
      kyc_status: "approved",
      two_factor_enabled: true,
    };
    mockPost.mockResolvedValueOnce(
      axiosResponse({ statusCode: 200, success: true, message: "ok", data: rawUser })
    );
    const result = await auth.login(loginData);
    expect(result.data.data).toMatchObject({
      firstName: "Sarah",
      lastName: "Lee",
      isVerified: true,
      isIDverified: true,
      kycStatus: "approved",
      twoFaEnabled: true,
    });
  });

  it("leaves the payload untouched when no token exists anywhere", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await auth.login(loginData);
    expect(result.data).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("login failed"));
    await expect(auth.login(loginData)).rejects.toThrow("login failed");
  });
});

describe("auth.verifyEmail", () => {
  it("posts email and otp without a verification token", async () => {
    const response = axiosResponse({ success: true });
    mockPost.mockResolvedValueOnce(response);
    const result = await auth.verifyEmail({ email: "e@x.com", otp: "1234" });
    expect(mockPost).toHaveBeenCalledWith(
      "users/verify_email",
      { email: "e@x.com", otp: "1234" },
      undefined
    );
    expect(result).toEqual(response);
  });

  it("attaches the Authorization header when verify-token is present", async () => {
    sessionStorage.setItem("verify-token", "ss-vt");
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await auth.verifyEmail({ email: "e@x.com", otp: "5678" });
    expect(mockPost).toHaveBeenCalledWith(
      "users/verify_email",
      { email: "e@x.com", otp: "5678" },
      { headers: { Authorization: "Bearer ss-vt" } }
    );
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("bad otp"));
    await expect(auth.verifyEmail({ email: "e@x.com", otp: "0000" })).rejects.toThrow("bad otp");
  });
});

describe("auth.forgotPassword", () => {
  it("posts the email", async () => {
    const response = axiosResponse({ success: true });
    mockPost.mockResolvedValueOnce(response);
    const result = await auth.forgotPassword({ email: "who@x.com" });
    expect(mockPost).toHaveBeenCalledWith("users/forgot_password", { email: "who@x.com" });
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("no user"));
    await expect(auth.forgotPassword({ email: "who@x.com" })).rejects.toThrow("no user");
  });
});

describe("auth.resetPassword", () => {
  it("posts newPassword/confirmPassword without otp or token", async () => {
    const response = axiosResponse({ success: true });
    mockPost.mockResolvedValueOnce(response);
    const result = await auth.resetPassword({ password: "np", confirmPassword: "cp" });
    expect(mockPost).toHaveBeenCalledWith(
      "users/reset_password",
      { newPassword: "np", confirmPassword: "cp" },
      undefined
    );
    expect(result).toEqual(response);
  });

  it("includes otp when provided", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await auth.resetPassword({ password: "np", confirmPassword: "cp", otp: "9999" });
    expect(mockPost).toHaveBeenCalledWith(
      "users/reset_password",
      { newPassword: "np", confirmPassword: "cp", otp: "9999" },
      undefined
    );
  });

  it("attaches the Authorization header when verify-token is present", async () => {
    sessionStorage.setItem("verify-token", "ss-rv");
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await auth.resetPassword({ password: "np", confirmPassword: "cp" });
    expect(mockPost).toHaveBeenCalledWith(
      "users/reset_password",
      { newPassword: "np", confirmPassword: "cp" },
      { headers: { Authorization: "Bearer ss-rv" } }
    );
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("reset failed"));
    await expect(auth.resetPassword({ password: "np", confirmPassword: "cp" })).rejects.toThrow(
      "reset failed"
    );
  });
});

describe("auth.startKyc", () => {
  it("posts to kyc_start and returns response.data", async () => {
    const payload = { accessToken: "at", inquiryId: "inq-1", sessionToken: "st", token: "tk" };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await auth.startKyc();
    expect(mockPost).toHaveBeenCalledWith("users/kyc_start");
    expect(result).toEqual(payload);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("kyc failed"));
    await expect(auth.startKyc()).rejects.toThrow("kyc failed");
  });
});

describe("auth.checkKycStatus", () => {
  it("fetches and normalizes the KYC status", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: { status: "verified" } }));
    const result = await auth.checkKycStatus();
    expect(mockGet).toHaveBeenCalledWith("users/kyc_status");
    expect(result.status).toBe("verified");
    expect(result.kycStatus).toBe("verified");
    expect(result.verified).toBe(true);
    expect(result.isIDverified).toBe(true);
    expect(result.data.kycStatus).toBe("verified");
  });

  it("defaults to not_submitted when no status is present", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: {} }));
    const result = await auth.checkKycStatus();
    expect(result.status).toBe("not_submitted");
    expect(result.verified).toBe(false);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("kyc check failed"));
    await expect(auth.checkKycStatus()).rejects.toThrow("kyc check failed");
  });
});

describe("auth.verifyLogin2FA", () => {
  const twoFAData = { loginChallengeToken: "lc", totpCode: "123456", rememberMe: true };

  it("posts the second-factor payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await auth.verifyLogin2FA(twoFAData);
    expect(mockPost).toHaveBeenCalledWith("users/login/verify-second-factor", twoFAData);
  });

  it("normalizes the auth payload and nested user", async () => {
    mockPost.mockResolvedValueOnce(
      axiosResponse({ data: { accessToken: "2fa-token", firstName: "Bob" } })
    );
    const result = await auth.verifyLogin2FA(twoFAData);
    expect(result.data.accessToken).toBe("2fa-token");
    expect(result.data.data).toMatchObject({ firstName: "Bob" });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("2fa failed"));
    await expect(auth.verifyLogin2FA(twoFAData)).rejects.toThrow("2fa failed");
  });
});