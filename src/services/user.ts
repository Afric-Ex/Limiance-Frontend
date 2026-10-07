import { api } from "../lib/axios";
import { normalizeUser } from "../lib/normalize-user";
import { normalizeKycStatus } from "../lib/normalize-kyc-status";
import { ApiResponse } from "../types/api";

export const userKeys = {
  userDetails: ["user-details"] as const,
  sessions: ["sessions"] as const,
  apiKeys: ["api-keys"] as const,
  settings: ["settings"] as const,
  kycStatus: ["kyc-status"] as const,
  twoFASetup: ["2fa-setup"] as const,
  loginLogs: (params?: any) => ["login-logs", params],
} as const;

export const userService = {
  getUser: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/user_details");
    if (response?.data?.data) {
      response.data.data = normalizeUser(response.data.data);
    }
    return response.data;
  },

  updateUser: async (data: {
    username: string;
    phone: string;
    password: string;
    photo: string;
    firstName: string;
    lastName: string;
    country: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/update_user", data);
    return response.data;
  },

  // 2FA
  enable2FA: async (): Promise<ApiResponse<any>> => {
    const response = await api.post("users/enable_2fa");
    return response.data;
  },
  verify2FA: async (data: { code: string }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/verify_2fa", data);
    return response.data;
  },
  disable2FA: async (data: { code: string }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/disable_2fa", data);
    return response.data;
  },
  verifyLogin2FA: async (data: { user_id: string; code: string; rememberMe?: boolean }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/verify_2fa_login", data);
    return response.data;
  },
  enableEmailOtp: async (): Promise<ApiResponse<any>> => {
    const response = await api.post("users/enable_email_otp_login");
    return response.data;
  },
  disableEmailOtp: async (): Promise<ApiResponse<any>> => {
    const response = await api.post("users/disable_email_otp_login");
    return response.data;
  },

  // Password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/change_password", data);
    return response.data;
  },

  // Sessions
  getActiveSessions: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("users/active_sessions");
    return response.data;
  },
  revokeSession: async (sessionId: string): Promise<ApiResponse<any>> => {
    const response = await api.post("users/revoke_session", { sessionId });
    return response.data;
  },

  // API Keys
  listApiKeys: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("users/api_keys");
    return response.data;
  },
  createApiKey: async (data: {
    label: string;
    permissions: string[];
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/api_keys", data);
    return response.data;
  },
  deleteApiKey: async (keyId: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`users/api_keys/${keyId}`);
    return response.data;
  },

  // Settings
  getSettings: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("users/settings");
    return response.data;
  },
  saveSettings: async (data: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = await api.patch("users/app_settings", data);
    return response.data;
  },

  // Login Logs
  getLoginLogs: async (params?: { query?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> => {
    const response = await api.get("users/login_logs", { params });
    return response.data;
  },

  // KYC
  getKycStatus: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("users/kyc_status");
    return normalizeKycStatus(response.data);
  },
  startKycSession: async (): Promise<ApiResponse<any>> => {
    const response = await api.post("users/kyc_start");
    return response.data;
  },
  upgradeKyc: async (): Promise<ApiResponse<any>> => {
    const response = await api.post("users/kyc_upgrade");
    return response.data;
  },
};
