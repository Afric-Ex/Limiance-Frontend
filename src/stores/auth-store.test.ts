import { useAuthStore } from "./auth-store";

describe("auth-store", () => {
  const initialData = {
    rememberMe: false,
    country: "",
    email: "",
    otp: "",
    pending2FAUserId: null,
    pending2FAChallengeToken: null,
    pending2FAMethod: "email" as "totp" | "email",
    pending2FARememberMe: false,
  };

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState(initialData);
  });

  it("has the initial state values", () => {
    const state = useAuthStore.getState();
    expect(state.rememberMe).toBe(false);
    expect(state.country).toBe("");
    expect(state.email).toBe("");
    expect(state.otp).toBe("");
    expect(state.pending2FAUserId).toBeNull();
    expect(state.pending2FAChallengeToken).toBeNull();
    expect(state.pending2FAMethod).toBe("email");
    expect(state.pending2FARememberMe).toBe(false);
  });

  it("setRememberMe toggles the flag", () => {
    useAuthStore.getState().setRememberMe(true);
    expect(useAuthStore.getState().rememberMe).toBe(true);
    useAuthStore.getState().setRememberMe(false);
    expect(useAuthStore.getState().rememberMe).toBe(false);
  });

  it("setCountry handles normal and empty values", () => {
    useAuthStore.getState().setCountry("NG");
    expect(useAuthStore.getState().country).toBe("NG");
    useAuthStore.getState().setCountry("");
    expect(useAuthStore.getState().country).toBe("");
  });

  it("setEmail handles normal and empty values", () => {
    useAuthStore.getState().setEmail("user@limiance.io");
    expect(useAuthStore.getState().email).toBe("user@limiance.io");
    useAuthStore.getState().setEmail("");
    expect(useAuthStore.getState().email).toBe("");
  });

  it("setOtp handles normal and empty values", () => {
    useAuthStore.getState().setOtp("123456");
    expect(useAuthStore.getState().otp).toBe("123456");
    useAuthStore.getState().setOtp("");
    expect(useAuthStore.getState().otp).toBe("");
  });

  it("setPendingLogin2FA sets the full pending 2FA payload", () => {
    useAuthStore.getState().setPendingLogin2FA("user-1", true, "challenge-42", "totp");
    const state = useAuthStore.getState();
    expect(state.pending2FAUserId).toBe("user-1");
    expect(state.pending2FAChallengeToken).toBe("challenge-42");
    expect(state.pending2FAMethod).toBe("totp");
    expect(state.pending2FARememberMe).toBe(true);
  });

  it("setPendingLogin2FA defaults the method to email and challenge token to null", () => {
    useAuthStore.getState().setPendingLogin2FA("user-2", false);
    const state = useAuthStore.getState();
    expect(state.pending2FAUserId).toBe("user-2");
    expect(state.pending2FAChallengeToken).toBeNull();
    expect(state.pending2FAMethod).toBe("email");
    expect(state.pending2FARememberMe).toBe(false);
  });

  it("setPendingLogin2FA keeps an explicitly empty challenge token", () => {
    useAuthStore.getState().setPendingLogin2FA("user-3", false, "");
    expect(useAuthStore.getState().pending2FAChallengeToken).toBe("");
    useAuthStore.getState().setPendingLogin2FA("user-3", false, null as unknown as string);
    expect(useAuthStore.getState().pending2FAChallengeToken).toBeNull();
  });

  it("clearPendingLogin2FA resets every pending 2FA field to defaults", () => {
    useAuthStore.getState().setPendingLogin2FA("user-1", true, "challenge-42", "totp");
    useAuthStore.getState().clearPendingLogin2FA();
    const state = useAuthStore.getState();
    expect(state.pending2FAUserId).toBeNull();
    expect(state.pending2FAChallengeToken).toBeNull();
    expect(state.pending2FAMethod).toBe("email");
    expect(state.pending2FARememberMe).toBe(false);
  });

  it("persists partialized state to localStorage under the auth-store key", () => {
    useAuthStore.getState().setRememberMe(true);
    useAuthStore.getState().setEmail("persisted@limiance.io");
    useAuthStore.getState().setPendingLogin2FA("user-p", true, "tok", "totp");

    const raw = localStorage.getItem("auth-store");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string)?.state;
    expect(stored.rememberMe).toBe(true);
    expect(stored.email).toBe("persisted@limiance.io");
    expect(stored.pending2FAUserId).toBe("user-p");
    expect(stored.pending2FAChallengeToken).toBe("tok");
    expect(stored.pending2FAMethod).toBe("totp");
    expect(stored.pending2FARememberMe).toBe(true);
  });
});