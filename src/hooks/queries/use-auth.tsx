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
import { clearLoginGrace, markLoginGrace } from "@/src/lib/login-grace";
import { userService } from "@/src/services/user";
import { wsClient } from "@/src/lib/websocket-client";

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

  /**
   * Ask the server whether the login already produced a session (the session lives in
   * an httpOnly cookie, so the only way to know is to use it).
   *  - true  -> signed in
   *  - false -> not signed in yet: another factor is genuinely needed
   *  - null  -> could not tell (network/server error): never guess
   * Retries a 401 once, because a fresh cookie can lose a race with the first request.
   */
  const hasActiveSession = async (): Promise<boolean | null> => {
    // Keep the global 401 handler from treating this probe's answer as an expired session.
    markLoginGrace();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await userService.getUser();
        return Boolean(response?.data);
      } catch (error: any) {
        if (error?.response?.status === 401) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            continue;
          }
          clearLoginGrace();
          return false;
        }
        clearLoginGrace();
        return null;
      }
    }
    clearLoginGrace();
    return false;
  };

  const getLoginSecondFactorMethod = (payload: any) => {
    if (payload?.emailOtpRequired || payload?.data?.emailOtpRequired) return "email" as const;
    return "totp" as const;
  };

  const persistLoginSession = async (payload: any) => {
    // The first dashboard requests can beat the browser's cookie store. Keep
    // 401s from tearing the fresh session down for a short window; see
    // login-grace.ts.
    markLoginGrace();
    authDebug("persist-session", {
      payload: describeAuthPayload(payload),
      credentialMode: "http-only-cookie",
    });

    if (typeof payload?.wsToken === "string" && payload.wsToken) {
      wsClient.setAuthTicket(payload.wsToken);
    }

    const user = getLoginUser(payload);
    // Some success replies carry only identifiers (e.g. `{ id, isActive }` on
    // the second-factor step), not a full profile. Persisting that would leave
    // the app with an identity-less user, so hydrate from `/user_details` via
    // the freshly-set session cookie when identity fields are missing.
    const hasIdentity = Boolean(user && (user.email || user.username || user.firstName));
    if (user && hasIdentity) {
      setUser(user);
      if (!payload?.wsToken) {
        void useUserStore.getState().fetchUser();
      }
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
      // A response that already reports success is a finished login; leftover
      // flags like `emailOtpRequired` describe account configuration, not a
      // pending second-factor step.
      if (data?.success !== true && requiresSecondFactor && challengeToken) {
        setPendingLogin2FA(userId || challengeToken, variables.rememberMe, challengeToken, getLoginSecondFactorMethod(data));
        setEmail(variables.emailOrPhone);
        push("/auth/verify-2fa");
        return;
      }
      if (data?.success !== true && requiresSecondFactor) {
        errorNotification("Your login session could not be started. Please log in again.");
        return;
      }
      await persistLoginSession(data);
      successNotification("Login successful");
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
      // success:true (or an issued wsToken) means the session cookie is live and
      // the login is finished. Leftover flags such as `emailOtpRequired` reflect
      // the account's configuration, not a pending factor — complete the login
      // instead of falling into the "another factor required" branches.
      if (data?.success === true || (typeof data?.wsToken === "string" && data.wsToken)) {
        await persistLoginSession(data);
        successNotification("Login successful");
        push("/dashboard");
        return;
      }

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

      // The reply says nothing about a next step and carries no user. Cookie-only
      // backends answer a finished login with an empty body, so an empty reply must not
      // be read as "authenticator needed". Ask the server instead of guessing.
      if (
        pending2FAMethod === "email" &&
        !data?.authenticated &&
        !data?.data?.user &&
        pending2FAChallengeToken
      ) {
        const sessionActive = await hasActiveSession();
        if (sessionActive === null) {
          errorNotification("We couldn't confirm your login. Please try again.");
          return;
        }
        if (sessionActive === false) {
          // Genuinely not signed in yet: the account needs the authenticator step.
          setPendingLogin2FA(
            pending2FAUserId || pending2FAChallengeToken,
            pending2FARememberMe,
            pending2FAChallengeToken,
            "totp"
          );
          successNotification("Email code verified. Enter your authenticator code to continue.");
          return;
        }
        // sessionActive === true: signed in, fall through to the normal login completion.
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