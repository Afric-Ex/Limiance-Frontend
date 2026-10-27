import { auth } from "@/src/services/auth";
import { authDebug, describeAuthPayload } from "@/src/lib/auth-debug";
import { Login, LoginResponse } from "@/src/types/auth";
import { mutate } from "../use-query-factory";
import { useRouter } from "next/navigation";
import {
  loginSchema,
  otpSchema,
  registerSchema,
  resetSchema,
} from "@/src/lib/schemas";
import { useForm, zodResolver } from "@mantine/form";
import { useAuthStore } from "@/src/stores/auth-store";
import { SuccessModal } from "@/src/components/login/verify-email-success";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "@/src/lib/notification-handler";
import { useUserStore } from "@/src/stores/user-store";
import { sessionCoordinator } from "@/src/lib/session-coordinator";
import { revokeBackendSession } from "@/src/lib/handle-logout";

type OtpFormValues = {
  otp: string;
};

type RegisterFormValues = {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
};

type ResetFormValues = {
  password: string;
  confirmPassword: string;
};

export const useAuth = () => {
  const country = useAuthStore((state) => state.country);
  const setCountry = useAuthStore((state) => state.setCountry);
  const emailOrPhone = useAuthStore((state) => state.email);
  const setEmail = useAuthStore((state) => state.setEmail);
  const otp = useAuthStore((state) => state.otp);
  const setOtp = useAuthStore((state) => state.setOtp);

  const pending2FAUserId = useAuthStore((state) => state.pending2FAUserId);
  const pending2FAChallengeToken = useAuthStore((state) => state.pending2FAChallengeToken);
  const pending2FAMethod = useAuthStore((state) => state.pending2FAMethod);
  const pending2FARememberMe = useAuthStore((state) => state.pending2FARememberMe);
  const setPendingLogin2FA = useAuthStore((state) => state.setPendingLogin2FA);
  const clearPendingLogin2FA = useAuthStore((state) => state.clearPendingLogin2FA);
  const setUser = useUserStore((state) => state.setUser);

  const { push } = useRouter();
  const getLoginUser = (payload: any) =>
    payload?.user ||
    payload?.data?.user ||
    payload?.data;

  const getLoginChallengeToken = (payload: any) =>
    payload?.loginChallengeToken ||
    payload?.challengeToken ||
    payload?.data?.loginChallengeToken ||
    payload?.data?.challengeToken ||
    payload?.data?.login_challenge_token ||
    payload?.data?.challenge_token;

  const getLoginChallengeUserId = (payload: any) =>
    payload?.user_id ||
    payload?.userId ||
    payload?.data?.user_id ||
    payload?.data?.userId ||
    payload?.data?.id;

  const requiresLoginSecondFactor = (payload: any) =>
    Boolean(
      payload?.needs_2fa ||
        payload?.needs2FA ||
        payload?.requiresSecondFactor ||
        payload?.secondFactorRequired ||
        payload?.emailOtpRequired ||
        payload?.totpRequired ||
        payload?.data?.needs_2fa ||
        payload?.data?.needs2FA ||
        payload?.data?.requiresSecondFactor ||
        payload?.data?.secondFactorRequired ||
        payload?.data?.emailOtpRequired ||
        payload?.data?.totpRequired ||
        getLoginChallengeToken(payload)
    );

  const getLoginSecondFactorMethod = (payload: any) => {
    if (payload?.emailOtpRequired || payload?.data?.emailOtpRequired) return "email" as const;
    return "totp" as const;
  };

  const persistLoginSession = async (payload: any) => {
    authDebug("persist-session", {
      payload: describeAuthPayload(payload),
      credentialMode: "http-only-cookie",
    });

    const user = getLoginUser(payload);
    if (user) {
      setUser(user);
    } else {
      // Cookie-only backends are free to answer a successful login with an
      // empty body: the credential is the Set-Cookie, not the payload. Ask the
      // authenticated `/user_details` endpoint who we are so the app still has an
      // identity to render.
      useUserStore.getState().setJustLoggedIn(true);
      try {
        await useUserStore.getState().fetchUser();
      } catch {
        // fetchUser already surfaces its own error; the redirect below still
        // lands on a page that will retry.
      }
      useUserStore.getState().setJustLoggedIn(false);
    }
    clearPendingLogin2FA();
    return true;
  };

  /**
   * Signing in while a session cookie is still around would otherwise leave the
   * previous session valid on the backend. Revoke it first so an account switch
   * cannot leave the old account reachable.
   */
  const clearStoredAuthToken = async () => {
    // Revoke the old backend session so an account switch can't leave it valid.
    // Do NOT call sessionCoordinator.logout() here — that bumps the generation
    // counter, which would cause the response interceptor to reject the
    // upcoming login response as "stale session" (ERR_SESSION_STALE).
    await revokeBackendSession();
  };

  // FORM FIELDS
  const otpForm = useForm<OtpFormValues>({
    initialValues: {
      otp: "",
    },
    validate: zodResolver(otpSchema),
  });

  const registerForm = useForm<RegisterFormValues>({
    initialValues: {
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      username: "",
    },
    validate: zodResolver(registerSchema),
  });

  const loginForm = useForm<Login>({
    initialValues: {
      emailOrPhone: "",
      rememberMe: false,
      password: "",
    },
    validate: zodResolver(loginSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: zodResolver(resetSchema),
  });

  const { mutate: register, isPending } = mutate(auth.register, {
    onSuccess: (_data: any, variables) => {
      successNotification("Registration successful");
      setCountry("");
      setEmail(variables.email);
      push("/auth/verify-email");
    },
  })();

  const { mutate: login, isPending: loginLoading } = mutate(auth.login, {
    onSuccess: async (data: LoginResponse, variables) => {
      const requiresSecondFactor = requiresLoginSecondFactor(data);
      const challengeToken = getLoginChallengeToken(data);
      const userId = getLoginChallengeUserId(data);
      if (requiresSecondFactor && challengeToken) {
        setPendingLogin2FA(userId || challengeToken, variables.rememberMe, challengeToken, getLoginSecondFactorMethod(data));
        setEmail(variables.emailOrPhone);
        push("/auth/verify-2fa");
        return;
      }
      if (requiresSecondFactor) {
        errorNotification("Your login session could not be started. Please log in again.");
        return;
      }
      await persistLoginSession(data);
      successNotification("Login successful");
      console.log("Login successful, redirecting to dashboard");
      // Use a small delay to ensure the cookie is set before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      push("/dashboard");
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      if (error?.response?.data?.error === "Account is not verified, resend verification code") {
        setEmail(loginForm.values.emailOrPhone);
      }
    },
  })();

  const { mutate: verifyLogin2FA, isPending: verifyLogin2FALoading } = mutate(auth.verifyLogin2FA, {
    onSuccess: async (data) => {
      if (requiresLoginSecondFactor(data)) {
        const challengeToken = getLoginChallengeToken(data);

        if (!challengeToken) {
          errorNotification("Your login session could not continue. Please log in again.");
          clearPendingLogin2FA();
          push("/auth/login");
          return;
        }

        setPendingLogin2FA(
          getLoginChallengeUserId(data) || pending2FAUserId || challengeToken,
          pending2FARememberMe,
          challengeToken,
          getLoginSecondFactorMethod(data)
        );
        successNotification("Email code verified. Enter your authenticator code to continue.");
        return;
      }

      // Some deployed API versions omit requiresSecondFactor/totpRequired after
      // accepting email OTP, but also return no access token. The email step has
      // still advanced the server challenge, so continue with the authenticator.
      if (
        pending2FAMethod === "email" &&
        !data?.authenticated &&
        !data?.data?.user &&
        pending2FAChallengeToken
      ) {
        setPendingLogin2FA(
          pending2FAUserId || pending2FAChallengeToken,
          pending2FARememberMe,
          pending2FAChallengeToken,
          "totp"
        );
        successNotification("Email code verified. Enter your authenticator code to continue.");
        return;
      }

      await persistLoginSession(data);
      successNotification("Login successful");
      push("/dashboard");
    },
  })();

  const { mutate: reset, isPending: resetLoading } = mutate(
    auth.resetPassword,
    {
      onSuccess: () => {
        modals.open({
          children: (
            <SuccessModal
              title="Congratulations"
              description="Your password has been reset successfully. Please proceed to login"
              onProceed={() => {
                push("/auth/login");
                modals.closeAll();
              }}
              onClose={() => {
                push("/auth/login");
                modals.closeAll();
              }}
            />
          ),
          ...DEFAULT_MODAL_SETTINGS,
          closeOnClickOutside: false,
        });
      },
    }
  )();
  const handleOnVerifySuccess = () => {
    modals.closeAll();
    const url = window.location.href;
    const params = new URLSearchParams(new URL(url).search);
    const referrer = params.get("referrer");
    
    // Only clear the email if we are NOT going to reset-password
    if (referrer !== "forgot_password" && typeof window !== "undefined") {
      setEmail("");
    }
    
    if (referrer === "forgot_password") {
      push("/auth/reset-password");
    } else push("/auth/login");
  };

  const { mutate: verify, isPending: verifyLoading } = mutate(
    auth.verifyEmail,
    {
      onSuccess: () => {
        modals.open({
          children: (
            <SuccessModal
              title="Congratulations"
              description={
                <>
                  Your email{" "}
                  <span className="text-primary">{emailOrPhone}</span> has been
                  successfully verified
                </>
              }
              onProceed={handleOnVerifySuccess}
              onClose={handleOnVerifySuccess}
            />
          ),
          ...DEFAULT_MODAL_SETTINGS,
          closeOnClickOutside: false,
        });
      },
    }
  )();

  const { mutate: forgotPassword, isPending: forgotLoading } = mutate(
    auth.forgotPassword,
    {
      onSuccess: (_data: any) => {
        modals.closeAll();
        successNotification("Successful");
        modals.open({
          children: (
            <SuccessModal
              title="Email Sent"
              description="A verification code has been sent to your email. Please check your inbox."
              onProceed={() => {
                push("/auth/verify-email?referrer=forgot_password");
                modals.closeAll();
              }}
              onClose={() => {
                push("/auth/verify-email?referrer=forgot_password");
                modals.closeAll();
              }}
            />
          ),
          ...DEFAULT_MODAL_SETTINGS,
          closeOnClickOutside: false,
        });
      },
    }
  )();

  const handleRegister = registerForm.onSubmit((values) => {
    register({ ...values, country });
  });

  const submitLogin = async (values: Login) => {
    login({
      ...values,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Mozilla/5.0",
    });
  };

  const handleVerify = otpForm.onSubmit((values) => {
    setOtp(values.otp);
    verify({ ...values, email: emailOrPhone });
  });

  const handleForgotPassword = () => {
    forgotPassword({ email: emailOrPhone });
  };

  const handleResetPassword = resetForm.onSubmit((values) => {
    reset({ ...values, otp, email: emailOrPhone });
  });

  return {
    emailOrPhone,
    registerForm,
    loginForm,
    otpForm,
    resetForm,

    registerLoading: isPending,
    loginLoading,
    verifyLoading,
    forgotLoading,
    resetLoading,
    verifyLogin2FALoading,

    pending2FAUserId,
    pending2FAChallengeToken,
    pending2FAMethod,
    pending2FARememberMe,
    clearPendingLogin2FA,

    handleRegister,
    submitLogin,
    handleVerify,
    handleForgotPassword,
    handleResetPassword,
    verifyLogin2FA,
  };
};
