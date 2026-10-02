import { api } from "../lib/axios";
import { normalizeUser } from "../lib/normalize-user";
import { normalizeKycStatus } from "../lib/normalize-kyc-status";
import { authDebug, describeAuthPayload } from "../lib/auth-debug";
import { ApiResponse } from "../types/api";
import { useAuthStore } from "../stores/auth-store";
import {
  Login,
  LoginResponse,
  VerifyLoginSecondFactor,
  Register,
  RegisterResponse,
  VerifyEmail,
} from "../types/auth";

// Authentication is established by the backend session cookie. The frontend
// deliberately does not extract, normalize, or persist access tokens.
const normalizeAuthPayload = (payload: any) => payload;

export const auth = {
  register: async (data: Register): Promise<ApiResponse<RegisterResponse>> => {
    const response = await api.post("users/register", {
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      country: data.country,
    });
    return response;
  },
  login: async (data: Login): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post("users/login", {
      emailOrPhone: data.emailOrPhone,
      password: data.password,
      rememberMe: data.rememberMe,
      userAgent: data.userAgent,
      lotNumber: data.lotNumber,
      captchaOutput: data.captchaOutput,
      passToken: data.passToken,
      genTime: data.genTime,
    });
    response.data = normalizeAuthPayload(response.data);
    authDebug("login-response", {
      status: response.status,
      headers: Object.keys(response.headers ?? {}),
      payload: describeAuthPayload(response.data),
    });
    if (response?.data?.data) {
      response.data.data = normalizeUser(response.data.data);
    }
    return response;
  },
  verifyEmail: async (data: VerifyEmail): Promise<ApiResponse<any>> => {
    const verifyToken = useAuthStore.getState().verificationToken;
    const response = await api.post(
      "users/verify_email",
      { email: data.email, otp: data.otp },
      verifyToken ? { headers: { Authorization: `Bearer ${verifyToken}` } } : undefined
    );
    return response;
  },
  forgotPassword: async (data: {
    email: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("users/forgot_password", {
      email: data.email,
    });
    return response;
  },
  resetPassword: async (data: {
    password: string;
    confirmPassword: string;
    otp?: string;
    email?: string;
  }): Promise<ApiResponse<any>> => {
    const verifyToken = useAuthStore.getState().verificationToken;
    const response = await api.post(
      "users/reset_password",
      {
        email: data.email,
        code: data.otp,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      },
      verifyToken ? { headers: { Authorization: `Bearer ${verifyToken}` } } : undefined
    );
    return response;
  },
  startKyc: async (): Promise<{
    data: { accessToken?: string; inquiryId?: string; sessionToken?: string; token?: string };
  }> => {
    const response = await api.post("users/kyc_start");
    return response.data;
  },
  checkKycStatus: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("users/kyc_status");
    return normalizeKycStatus(response.data);
  },
  verifyLogin2FA: async (data: VerifyLoginSecondFactor): Promise<ApiResponse<any>> => {
    authDebug("verify-2fa-request", {
      endpoint: "users/login/verify-second-factor",
      challengeTokenPresent: Boolean(data.loginChallengeToken),
      challengeTokenLength: data.loginChallengeToken?.length ?? 0,
      emailOtpLength: data.emailOtpCode?.length ?? 0,
      totpLength: data.totpCode?.length ?? 0,
      rememberMe: Boolean(data.rememberMe),
    });
    const response = await api.post("users/login/verify-second-factor", data);
    authDebug("verify-2fa-response", {
      status: response.status,
      responseKeys:
        response.data && typeof response.data === "object"
          ? Object.keys(response.data)
          : [],
    });
    response.data = normalizeAuthPayload(response.data);
    if (response?.data?.data) {
      response.data.data = normalizeUser(response.data.data);
    }
    return response;
  },
};
