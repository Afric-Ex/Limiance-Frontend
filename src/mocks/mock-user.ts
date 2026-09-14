import {
  MOCK_KYC_STATUS,
  MOCK_SESSIONS,
  MOCK_2FA_QR,
  MOCK_SETTINGS,
} from "./data/user-data";

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// mutable state
const mockKycStatus = { ...MOCK_KYC_STATUS };
let mockSessions = [...MOCK_SESSIONS];
let mockSettings = { ...MOCK_SETTINGS };

export const mockUser = {
  uploadKycDocument: async (data: {
    type: "id_front" | "id_back" | "selfie";
    file: string;
  }) => {
    await delay(1200);
    return {
      data: { type: data.type, uploaded: true },
      statusCode: 200,
      success: true,
      message: "Document uploaded",
    };
  },

  checkKycStatus: async () => {
    await delay();
    return {
      data: mockKycStatus,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    await delay(800);
    if (data.newPassword !== data.confirmPassword) {
      throw {
        response: {
          data: { error: "New password and confirm password do not match" },
          status: 400,
        },
      };
    }
    if (data.newPassword.length < 8) {
      throw {
        response: {
          data: { error: "Password must be at least 8 characters" },
          status: 400,
        },
      };
    }
    return {
      data: { success: true },
      statusCode: 200,
      success: true,
      message: "Password changed",
    };
  },

  generateAuthenticatorQR: async () => {
    await delay();
    return {
      data: MOCK_2FA_QR,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  verifyAuthenticatorOTP: async (data: { token: string }) => {
    await delay(800);
    if (!/^\d{6}$/.test(data.token)) {
      throw {
        response: {
          data: { error: "OTP must be exactly 6 digits" },
          status: 400,
        },
      };
    }
    return {
      data: { verified: true },
      statusCode: 200,
      success: true,
      message: "2FA enabled",
    };
  },

  disable2FA: async () => {
    await delay(800);
    return {
      data: { disabled: true },
      statusCode: 200,
      success: true,
      message: "2FA disabled",
    };
  },

  getActiveSessions: async () => {
    await delay();
    return {
      data: mockSessions,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  revokeSession: async (sessionId: string) => {
    await delay(800);
    mockSessions = mockSessions.filter((s) => s.id !== sessionId);
    return {
      data: { sessionId, revoked: true },
      statusCode: 200,
      success: true,
      message: "Session revoked",
    };
  },

  getSettings: async () => {
    await delay();
    return {
      data: mockSettings,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  saveSettings: async (data: Partial<typeof MOCK_SETTINGS>) => {
    await delay(800);
    mockSettings = { ...mockSettings, ...data };
    return {
      data: mockSettings,
      statusCode: 200,
      success: true,
      message: "Settings saved",
    };
  },
};
