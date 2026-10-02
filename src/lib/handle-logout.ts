import { sessionCoordinator } from "./session-coordinator";
import { useAuthStore } from "../stores/auth-store";
import { useUserStore } from "../stores/user-store";

function clearSession(reason: "manual" | "unauthorized" | "expired" | "account-switch") {
  useAuthStore.getState().reset();
  useUserStore.getState().reset();
  sessionCoordinator.logout(reason);
}

export const handleLogout = (error?: any) => {
  if (error) {
    if (error.response?.status === 401) {
      const errorMsg = String(
        error.response?.data?.error || error.response?.data?.message || ""
      );

      // These 401s are not "session expired" — don't log the user out
      if (
        errorMsg === "Account is not verified, resend verification code" ||
        errorMsg.toLowerCase().includes("identity verification") ||
        errorMsg.toLowerCase().includes("kyc") ||
        errorMsg.toLowerCase().includes("authorization token not provided") ||
        errorMsg.toLowerCase().includes("token not provided")
      ) {
        return;
      }

      clearSession("unauthorized");
      if (
        typeof location !== "undefined" &&
        location.pathname !== "/auth/login" &&
        !location.pathname.includes("/auth/signup")
      ) {
        window.location.href = "/auth/login";
      }
    }
  } else {
    // Manual logout call (no error) — always clear session
    clearSession("manual");
    if (
      typeof location !== "undefined" &&
      location.pathname !== "/auth/login" &&
      !location.pathname.includes("/auth/signup")
    ) {
      window.location.href = "/auth/login";
    }
  }
};
