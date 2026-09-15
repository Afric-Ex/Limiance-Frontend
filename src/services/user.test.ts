vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { userKeys, userService } from "./user";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

const axiosResponse = (data: unknown, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config: {},
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("userKeys", () => {
  it("declares the expected query keys", () => {
    expect(userKeys.userDetails).toEqual(["user-details"]);
    expect(userKeys.sessions).toEqual(["sessions"]);
    expect(userKeys.apiKeys).toEqual(["api-keys"]);
    expect(userKeys.settings).toEqual(["settings"]);
    expect(userKeys.kycStatus).toEqual(["kyc-status"]);
    expect(userKeys.twoFASetup).toEqual(["2fa-setup"]);
    expect(userKeys.loginLogs({ query: "x", page: 1 })).toEqual(["login-logs", { query: "x", page: 1 }]);
  });
});

describe("userService.getUser", () => {
  it("fetches and normalizes the user", async () => {
    mockGet.mockResolvedValueOnce(
      axiosResponse({ data: { first_name: "Jane", is_verified: true } })
    );
    const result = await userService.getUser();
    expect(mockGet).toHaveBeenCalledWith("/user");
    expect(result.data).toMatchObject({ firstName: "Jane", isVerified: true });
    expect(result.data).toHaveProperty("isIDverified", false);
  });

  it("returns the payload unchanged when no user data is present", async () => {
    const response = axiosResponse({ success: true });
    mockGet.mockResolvedValueOnce(response);
    const result = await userService.getUser();
    expect(mockGet).toHaveBeenCalledWith("/user");
    expect(result).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("get user failed"));
    await expect(userService.getUser()).rejects.toThrow("get user failed");
  });
});

describe("userService.updateUser", () => {
  const profileData = {
    username: "ada",
    phone: "123",
    password: "pw",
    photo: "pic.png",
    firstName: "Ada",
    lastName: "Lovelace",
    country: "GB",
  };

  it("posts the profile payload and resolves with response.data", async () => {
    const payload = { success: true };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await userService.updateUser(profileData);
    expect(mockPost).toHaveBeenCalledWith("users/update_user", profileData);
    expect(result).toEqual(payload);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("update failed"));
    await expect(userService.updateUser(profileData)).rejects.toThrow("update failed");
  });
});

describe("userService 2FA", () => {
  it("enable2FA posts to users/enable_2fa", async () => {
    const payload = { success: true };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await userService.enable2FA();
    expect(mockPost).toHaveBeenCalledWith("users/enable_2fa");
    expect(result).toEqual(payload);
  });

  it("enableEmailOtp posts to users/enable_email_otp_login", async () => {
    const payload = { success: true };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const result = await userService.enableEmailOtp();
    expect(mockPost).toHaveBeenCalledWith("users/enable_email_otp_login");
    expect(result).toEqual(payload);
  });

  it("disableEmailOtp posts to users/disable_email_otp_login", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.disableEmailOtp();
    expect(mockPost).toHaveBeenCalledWith("users/disable_email_otp_login");
  });

  it("verify2FA posts the code", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await userService.verify2FA({ code: "123456" });
    expect(mockPost).toHaveBeenCalledWith("users/verify_2fa", { code: "123456" });
    expect(result).toEqual({ success: true });
  });

  it("disable2FA posts the code", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.disable2FA({ code: "654321" });
    expect(mockPost).toHaveBeenCalledWith("users/disable_2fa", { code: "654321" });
  });

  it("verifyLogin2FA posts user_id, code and rememberMe", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.verifyLogin2FA({ user_id: "u1", code: "123456", rememberMe: true });
    expect(mockPost).toHaveBeenCalledWith("users/verify_2fa_login", {
      user_id: "u1",
      code: "123456",
      rememberMe: true,
    });
  });

  it("rejects when a 2FA request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("verify 2fa failed"));
    await expect(userService.verify2FA({ code: "123456" })).rejects.toThrow("verify 2fa failed");
    mockPost.mockRejectedValueOnce(new Error("enable 2fa failed"));
    await expect(userService.enable2FA()).rejects.toThrow("enable 2fa failed");
  });
});

describe("userService.changePassword", () => {
  it("posts the password payload", async () => {
    const payload = { success: true };
    mockPost.mockResolvedValueOnce(axiosResponse(payload));
    const data = { currentPassword: "old", newPassword: "new", confirmPassword: "new" };
    const result = await userService.changePassword(data);
    expect(mockPost).toHaveBeenCalledWith("users/change_password", data);
    expect(result).toEqual(payload);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("password failed"));
    await expect(
      userService.changePassword({
        currentPassword: "old",
        newPassword: "new",
        confirmPassword: "new",
      })
    ).rejects.toThrow("password failed");
  });
});

describe("userService sessions", () => {
  it("getActiveSessions fetches active sessions", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ sessions: ["s1"] }));
    const result = await userService.getActiveSessions();
    expect(mockGet).toHaveBeenCalledWith("users/active_sessions");
    expect(result).toEqual({ sessions: ["s1"] });
  });

  it("revokeSession posts the sessionId", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.revokeSession("s1");
    expect(mockPost).toHaveBeenCalledWith("users/revoke_session", { sessionId: "s1" });
  });

  it("rejects when a session request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("sessions failed"));
    await expect(userService.getActiveSessions()).rejects.toThrow("sessions failed");
    mockPost.mockRejectedValueOnce(new Error("revoke failed"));
    await expect(userService.revokeSession("s1")).rejects.toThrow("revoke failed");
  });
});

describe("userService api keys", () => {
  it("listApiKeys fetches the keys", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await userService.listApiKeys();
    expect(mockGet).toHaveBeenCalledWith("users/api_keys");
    expect(result).toEqual({ data: [] });
  });

  it("createApiKey posts label and permissions", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ key: "ak" }));
    await userService.createApiKey({ label: "cli", permissions: ["read"] });
    expect(mockPost).toHaveBeenCalledWith("users/api_keys", {
      label: "cli",
      permissions: ["read"],
    });
  });

  it("deleteApiKey deletes by key id", async () => {
    mockDelete.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.deleteApiKey("key-9");
    expect(mockDelete).toHaveBeenCalledWith("users/api_keys/key-9");
  });

  it("rejects when an api key request fails", async () => {
    mockDelete.mockRejectedValueOnce(new Error("delete failed"));
    await expect(userService.deleteApiKey("key-9")).rejects.toThrow("delete failed");
  });
});

describe("userService settings", () => {
  it("getSettings fetches settings", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ theme: "dark" }));
    const result = await userService.getSettings();
    expect(mockGet).toHaveBeenCalledWith("users/settings");
    expect(result).toEqual({ theme: "dark" });
  });

  it("saveSettings patches app settings", async () => {
    mockPatch.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.saveSettings({ notifications: false });
    expect(mockPatch).toHaveBeenCalledWith("users/app_settings", { notifications: false });
  });

  it("rejects when a settings request fails", async () => {
    mockPatch.mockRejectedValueOnce(new Error("settings failed"));
    await expect(userService.saveSettings({ x: 1 })).rejects.toThrow("settings failed");
  });
});

describe("userService.getLoginLogs", () => {
  it("fetches logs with params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const params = { query: "ada", page: 1, limit: 20 };
    await userService.getLoginLogs(params);
    expect(mockGet).toHaveBeenCalledWith("users/login_logs", { params });
  });

  it("fetches logs without params", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    await userService.getLoginLogs();
    expect(mockGet).toHaveBeenCalledWith("users/login_logs", { params: undefined });
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("logs failed"));
    await expect(userService.getLoginLogs()).rejects.toThrow("logs failed");
  });
});

describe("userService KYC", () => {
  it("getKycStatus fetches and normalizes the status", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: { status: "approved" } }));
    const result = await userService.getKycStatus();
    expect(mockGet).toHaveBeenCalledWith("users/kyc_status");
    expect(result.status).toBe("approved");
    expect(result.verified).toBe(true);
  });

  it("startKycSession posts to users/kyc_start", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ inquiryId: "inq" }));
    const result = await userService.startKycSession();
    expect(mockPost).toHaveBeenCalledWith("users/kyc_start");
    expect(result).toEqual({ inquiryId: "inq" });
  });

  it("upgradeKyc posts to users/kyc_upgrade", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    await userService.upgradeKyc();
    expect(mockPost).toHaveBeenCalledWith("users/kyc_upgrade");
  });

  it("rejects when a KYC request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("kyc failed"));
    await expect(userService.getKycStatus()).rejects.toThrow("kyc failed");
  });
});