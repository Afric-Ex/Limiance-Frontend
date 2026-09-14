/** Read auth-token directly from document.cookie */
function readAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function clearSession() {
  if (typeof document !== "undefined") {
    document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-store");
  }
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

      // Only actually log out if there IS a token (i.e. the session truly expired).
      // If there is no token yet, this is probably a pre-auth request — ignore it.
      const existingToken =
        (typeof localStorage !== "undefined" ? localStorage.getItem("auth-token") : null) ||
        readAuthToken();
      if (!existingToken || existingToken === "undefined" || existingToken === "null") {
        return;
      }

      clearSession();
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
    clearSession();
    if (
      typeof location !== "undefined" &&
      location.pathname !== "/auth/login" &&
      !location.pathname.includes("/auth/signup")
    ) {
      window.location.href = "/auth/login";
    }
  }
};
