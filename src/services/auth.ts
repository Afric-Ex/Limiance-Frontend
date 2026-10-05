import { api } from "../lib/axios";
import { normalizeUser } from "../lib/normalize-user";
import { normalizeKycStatus } from "../lib/normalize-kyc-status";
import { authDebug, describeAuthPayload } from "../lib/auth-debug";
import { ApiResponse } from "../types/api";
import {
  Login,
  LoginResponse,
  VerifyLoginSecondFactor,
  Register,
  RegisterResponse,
  VerifyEmail,
} from "../types/auth";

// Authentication is established by the backend session cookie. Nothing here
// extracts, normalizes, or persists an access token, and no endpoint sends an
// Authorization header: every call relies on the cookie the browser attaches to
// same-origin `/proxy` requests.

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
    }, {
      headers: { "X-Client-Type": "web" },
    });
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
  /**
   * Invalidate the backend session so the HttpOnly cookie stops authenticating.
   * The browser cannot clear the cookie itself, so this is the only thing that
   * makes logout survive a reload or a back-button navigation.
   */
  logout: async (): Promise<ApiResponse<any>> => {
    const response = await api.post("users/logout", {});
    return response;
  },
  verifyEmail: async (data: VerifyEmail): Promise<ApiResponse<any>> => {
    const response = await api.post("users/verify_email", { email: data.email, otp: data.otp });
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
    const response = await api.post("users/reset_password", {
      email: data.email,
      code: data.otp,
      newPassword: data.password,
      confirmPassword: data.confirmPassword,
    });
    return response;
  },
  /**
   * Third-party KYC provider token, not a Limiance session credential.
   *
   * The Sumsub Web SDK requires it in the page, so it cannot move to a cookie or
   * be dropped from the flow. It stays in React state for the lifetime of the
   * verification widget: never written to storage, never placed in a URL, and
   * never logged.
   */
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
    if (response?.data?.data) {
      response.data.data = normalizeUser(response.data.data);
    }
    return response;
  },
};
