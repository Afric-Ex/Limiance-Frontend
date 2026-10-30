import { sessionCoordinator } from "./session-coordinator";
import { useAuthStore } from "../stores/auth-store";
import { useUserStore } from "../stores/user-store";
import { auth } from "../services/auth";
import { authDebug } from "./auth-debug";
import { isInLoginGrace } from "./login-grace";

/**
 * True for the duration of a backend revocation call.
 *
 * The revocation request travels through the same axios client as everything
 * else, so a failure on it re-enters this module from the response interceptor.
 * Without this guard a 401 on `users/logout` would log the user out again (and
 * try to revoke again) instead of settling on the already-cleared local state.
 */
let revoking = false;

function clearSession(reason: "manual" | "unauthorized" | "expired" | "account-switch") {
  useAuthStore.getState().reset();
  useUserStore.getState().reset();
  sessionCoordinator.logout(reason);
}

const redirectToLogin = () => {
  if (
    typeof location !== "undefined" &&
    location.pathname !== "/auth/login" &&
    !location.pathname.includes("/auth/signup")
  ) {
    window.location.href = "/auth/login";
  }
};

/**
 * Tell the backend to invalidate the session cookie.
 *
 * Without this the HttpOnly cookie stays valid until it expires, so "log out"
 * would only clear local state: a reload, a back button or another tab would
 * silently restore the session. Best effort by design — a network failure must
 * not stop the user from leaving the session. Only meaningful for an explicit
 * action; on a 401 the server has already rejected the session and there is
 * nothing left to revoke.
 */
export const revokeBackendSession = async (): Promise<void> => {
  if (typeof window === "undefined" || revoking) return;
  revoking = true;
  try {
    await auth.logout();
  } catch {
    // Intentionally ignored — see above.
  } finally {
    revoking = false;
  }
};

export const handleLogout = async (error?: any) => {
  if (revoking) return;

  if (error) {
    if (error.response?.status !== 401) return;

    const errorMsg = String(
      error.response?.data?.error || error.response?.data?.message || ""
    );

    // These 401s are not "session expired" — they mean the backend refused this
    // request for a domain reason while no session exists yet. Note that
    // "credential missing" is deliberately *not* in this list: under cookie auth
    // an absent or rejected session cookie is exactly what must end the session.
    if (
      errorMsg === "Account is not verified, resend verification code" ||
      errorMsg.toLowerCase().includes("identity verification") ||
      errorMsg.toLowerCase().includes("kyc")
    ) {
      return;
    }

    // A 401 arriving seconds after a successful login is usually the cookie
    // store racing the first dashboard request, not a rejected session. Let the
    // caller retry instead of tearing the just-created session down.
    if (isInLoginGrace()) {
      authDebug("logout-suppressed", {
        reason: "login-grace",
        url: error?.config?.url,
        status: error?.response?.status,
      });
      return;
    }

    // The server already rejected this session; nothing left to revoke.
    clearSession("unauthorized");
    redirectToLogin();
    return;
  }

  // Manual logout — revoke server-side first so the cookie is dead before the
  // browser lands back on a page that would otherwise still be "logged in".
  await revokeBackendSession();
  clearSession("manual");
  redirectToLogin();
};
