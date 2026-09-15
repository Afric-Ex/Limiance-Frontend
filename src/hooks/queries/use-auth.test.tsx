import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { auth } from "@/src/services/auth";
import { successNotification, errorNotification } from "@/src/lib/notification-handler";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock("@/src/services/auth", () => ({
  auth: {
    register: vi.fn(),
    login: vi.fn(),
    verifyLogin2FA: vi.fn(),
    verifyEmail: vi.fn(),
    resetPassword: vi.fn(),
    forgotPassword: vi.fn(),
  },
  findAuthToken: vi.fn(() => null),
}));

vi.mock("@/src/lib/auth-debug", () => ({
  authDebug: vi.fn(),
  describeAuthPayload: vi.fn(() => ({})),
}));

vi.mock("@/src/mocks/mock-auth", () => ({
  mockAuth: {
    login: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock("@/src/mocks", () => ({
  MOCK_MODE: { auth: false },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/src/lib/schemas", () => ({
  loginSchema: {},
  otpSchema: {},
  registerSchema: {},
  resetSchema: {},
}));

vi.mock("@mantine/form", () => {
  const makeForm = (config?: any) => {
    const values: Record<string, any> = { ...(config?.initialValues ?? {}) };
    return {
      values,
      setFieldValue: vi.fn((field: string, value: any) => {
        values[field] = value;
      }),
      setValues: vi.fn((v: any) => Object.assign(values, v)),
      reset: vi.fn(() => Object.assign(values, config?.initialValues ?? {})),
      getInputProps: vi.fn(() => ({})),
      onSubmit: vi.fn((fn: any) => (vals: any) => fn(vals)),
    };
  };
  return {
    useForm: vi.fn((config: any) => makeForm(config)),
    zodResolver: vi.fn(() => () => ({})),
  };
});

const authStoreState: Record<string, any> = {
  country: "",
  setCountry: vi.fn((v: string) => { authStoreState.country = v; }),
  email: "",
  setEmail: vi.fn((v: string) => { authStoreState.email = v; }),
  otp: "",
  setOtp: vi.fn((v: string) => { authStoreState.otp = v; }),
  rememberMe: false,
  setRememberMe: vi.fn(),
  pending2FAUserId: null,
  pending2FAChallengeToken: null,
  pending2FAMethod: "email",
  pending2FARememberMe: false,
  setPendingLogin2FA: vi.fn((userId: string, rememberMe: boolean, challengeToken?: string, method: any = "email") => {
    authStoreState.pending2FAUserId = userId;
    authStoreState.pending2FAChallengeToken = challengeToken ?? null;
    authStoreState.pending2FAMethod = method;
    authStoreState.pending2FARememberMe = rememberMe;
  }),
  clearPendingLogin2FA: vi.fn(() => {
    authStoreState.pending2FAUserId = null;
    authStoreState.pending2FAChallengeToken = null;
    authStoreState.pending2FAMethod = "email";
    authStoreState.pending2FARememberMe = false;
  }),
};

vi.mock("@/src/stores/auth-store", () => ({
  useAuthStore: vi.fn((selector: any) => selector(authStoreState)),
}));

const userStoreState: Record<string, any> = {
  user: null,
  setUser: vi.fn((v: any) => { userStoreState.user = v; }),
  hideBalance: false,
  setHideBalance: vi.fn(),
};

vi.mock("@/src/stores/user-store", () => ({
  useUserStore: vi.fn((selector: any) => selector(userStoreState)),
}));

vi.mock("@/src/components/login/verify-email-success", () => ({
  SuccessModal: () => null,
}));

vi.mock("@/src/utils/constants", () => ({
  DEFAULT_MODAL_SETTINGS: { centered: true },
}));

vi.mock("@mantine/modals", () => ({
  modals: {
    open: vi.fn(),
    closeAll: vi.fn(),
  },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification: vi.fn(),
  errorNotification: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreState.country = "";
    authStoreState.email = "";
    authStoreState.otp = "";
    authStoreState.pending2FAUserId = null;
    authStoreState.pending2FAChallengeToken = null;
    authStoreState.pending2FAMethod = "email";
    authStoreState.pending2FARememberMe = false;
    userStoreState.user = null;
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("returns all expected properties", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.handleRegister).toBe("function");
    expect(typeof result.current.submitLogin).toBe("function");
    expect(typeof result.current.handleVerify).toBe("function");
    expect(typeof result.current.handleForgotPassword).toBe("function");
    expect(typeof result.current.handleResetPassword).toBe("function");
    expect(typeof result.current.verifyLogin2FA).toBe("function");
    expect(result.current.registerForm).toBeDefined();
    expect(result.current.loginForm).toBeDefined();
    expect(result.current.otpForm).toBeDefined();
    expect(result.current.resetForm).toBeDefined();
  });

  it("handleRegister calls register with country appended", async () => {
    
    auth.register.mockResolvedValue({
      data: { data: { accessToken: "tok" } },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.handleRegister({
        email: "a@b.com",
        phone: "123",
        password: "Password1!",
        confirmPassword: "Password1!",
        firstName: "A",
        lastName: "B",
        username: "ab",
      });
    });

    expect(auth.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", country: "" }),
    );
  });

  it("submitLogin clears stored token and calls login", async () => {
    localStorage.setItem("auth-token", "old-token");
    document.cookie = "auth-token=old-token; path=/";

    
    auth.login.mockResolvedValue({
      data: {
        statusCode: 200,
        error: "",
        message: "",
        success: true,
        accessToken: "jwt-token-123",
        data: { id: "u1" },
      },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitLogin({
        emailOrPhone: "user@x.com",
        password: "Password1!",
        rememberMe: false,
      });
    });

    expect(auth.login).toHaveBeenCalled();
    expect(localStorage.getItem("auth-token")).toBe("jwt-token-123");
  });

  it("login success persists session, shows notification and navigates", async () => {
    
    
    auth.login.mockResolvedValue({
      data: {
        statusCode: 200,
        error: "",
        message: "ok",
        success: true,
        accessToken: "jwt-token-456",
        data: { id: "user-2", email: "u@x.com" },
      },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitLogin({
        emailOrPhone: "user@x.com",
        password: "Password1!",
        rememberMe: false,
      });
    });

    expect(successNotification).toHaveBeenCalledWith("Login successful");
    expect(localStorage.getItem("auth-token")).toBe("jwt-token-456");
    expect(userStoreState.user).toEqual({ id: "user-2", email: "u@x.com" });
  });

  it("login with second factor required pushes verify-2fa", async () => {
    
    
    auth.login.mockResolvedValue({
      data: {
        statusCode: 200,
        error: "",
        message: "",
        success: true,
        data: {
          needs_2fa: true,
          loginChallengeToken: "challenge-1",
          user_id: "uid-1",
        },
      },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitLogin({
        emailOrPhone: "user@x.com",
        password: "Password1!",
        rememberMe: true,
      });
    });

    expect(useRouter().push).toHaveBeenCalledWith("/auth/verify-2fa");
    expect(authStoreState.pending2FAUserId).toBeTruthy();
    expect(authStoreState.pending2FAChallengeToken).toBe("challenge-1");
    expect(authStoreState.email).toBe("user@x.com");
  });

  it("login with second factor but no challenge shows error", async () => {
    
    
    auth.login.mockResolvedValue({
      data: {
        statusCode: 200,
        error: "",
        message: "",
        success: true,
        data: { needs_2fa: true },
      },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitLogin({
        emailOrPhone: "user@x.com",
        password: "Password1!",
        rememberMe: false,
      });
    });

    expect(errorNotification).toHaveBeenCalled();
  });

  it("login error with unverified message sets email", async () => {
    const err = new Error("unverified");
    (err as any).response = {
      data: { error: "Account is not verified, resend verification code" },
    };
    auth.login.mockRejectedValue(err);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.loginForm.setFieldValue("emailOrPhone", "unverified@x.com");
      result.current.loginForm.setFieldValue("password", "Password1!");
      result.current.loginForm.setFieldValue("rememberMe", false);
    });

    await act(async () => {
      result.current.submitLogin({
        emailOrPhone: "unverified@x.com",
        password: "Password1!",
        rememberMe: false,
      });
    });

    expect(authStoreState.email).toBe("unverified@x.com");
  });

  it("login without token shows error notification", async () => {
    
    
    auth.login.mockResolvedValue({
      data: { statusCode: 200, error: "", message: "", success: true, data: { id: "u" } },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.submitLogin({
        emailOrPhone: "u@x.com",
        password: "Password1!",
        rememberMe: false,
      });
    });

    expect(errorNotification).toHaveBeenCalled();
  });

  it("handleVerify sets otp and calls verify", async () => {
    
    auth.verifyEmail.mockResolvedValue({ data: { data: {} }, status: 200 });
    authStoreState.email = "verify@x.com";

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.handleVerify({ otp: "123456" });
    });

    expect(auth.verifyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ otp: "123456", email: "verify@x.com" }),
    );
  });

  it("handleForgotPassword calls forgotPassword", async () => {
    
    auth.forgotPassword.mockResolvedValue({
      data: { data: { accessToken: "verify-tok" } },
      status: 200,
    });
    authStoreState.email = "forgot@x.com";

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.handleForgotPassword();
    });

    expect(auth.forgotPassword).toHaveBeenCalledWith({ email: "forgot@x.com" });
  });

  it("handleResetPassword calls reset with otp", async () => {
    
    auth.resetPassword.mockResolvedValue({ data: { data: {} }, status: 200 });
    authStoreState.otp = "654321";

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.handleResetPassword({
        password: "Password1!",
        confirmPassword: "Password1!",
      });
    });

    expect(auth.resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "Password1!",
        confirmPassword: "Password1!",
        otp: "654321",
      }),
    );
  });

  it("verifyLogin2FA with remaining second factor keeps challenge", async () => {
    
    auth.verifyLogin2FA.mockResolvedValue({
      data: {
        statusCode: 200,
        error: "",
        message: "",
        success: true,
        data: {
          secondFactorRequired: true,
          loginChallengeToken: "challenge-next",
          user_id: "uid-9",
        },
      },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.verifyLogin2FA({
        loginChallengeToken: "challenge-1",
        totpCode: "123456",
      });
    });

    expect(authStoreState.pending2FAChallengeToken).toBe("challenge-next");
  });

  it("verifyLogin2FA persists session on terminal success", async () => {
    
    
    auth.verifyLogin2FA.mockResolvedValue({
      data: {
        statusCode: 200,
        error: "",
        message: "",
        success: true,
        accessToken: "final-jwt",
        data: { id: "u-final" },
      },
      status: 200,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.verifyLogin2FA({
        loginChallengeToken: "challenge-1",
        totpCode: "123456",
      });
    });

    expect(successNotification).toHaveBeenCalled();
    expect(localStorage.getItem("auth-token")).toBe("final-jwt");
  });

  it("verify from email method with no token continues to totp", async () => {
    
    
    auth.verifyLogin2FA.mockResolvedValue({
      data: { data: {} },
      status: 200,
    });
    authStoreState.pending2FAMethod = "email";
    authStoreState.pending2FAChallengeToken = "challenge-keep";
    authStoreState.pending2FAUserId = "uid-keep";

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.verifyLogin2FA({
        loginChallengeToken: "challenge-keep",
        emailOtpCode: "123456",
      });
    });

    expect(successNotification).toHaveBeenCalled();
    expect(authStoreState.pending2FAMethod).toBe("totp");
  });
});