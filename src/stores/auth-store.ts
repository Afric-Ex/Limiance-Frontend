import { create } from "zustand";

export interface AuthState {
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  country: string;
  setCountry: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  otp: string;
  setOtp: (value: string) => void;
  reset: () => void;
  pending2FAUserId: string | null;
  pending2FAChallengeToken: string | null;
  pending2FAMethod: "totp" | "email";
  pending2FARememberMe: boolean;
  setPendingLogin2FA: (userId: string, rememberMe: boolean, challengeToken?: string, method?: "totp" | "email") => void;
  clearPendingLogin2FA: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
      rememberMe: false,
      country: "",
      setCountry: (value) => set({ country: value }),
      email: "",
      setEmail: (value) => set({ email: value }),
      phone: "",
      setPhone: (value) => set({ phone: value }),
      otp: "",
      setOtp: (value) => set({ otp: value }),
      reset: () => set({
        rememberMe: false,
        country: "",
        email: "",
        phone: "",
        otp: "",
        pending2FAUserId: null,
        pending2FAChallengeToken: null,
        pending2FAMethod: "email",
        pending2FARememberMe: false,
      }),
      setRememberMe: (value) => set({ rememberMe: value }),
      pending2FAUserId: null,
      pending2FAChallengeToken: null,
      pending2FAMethod: "email",
      pending2FARememberMe: false,
      setPendingLogin2FA: (userId, rememberMe, challengeToken, method = "email") =>
        set({ pending2FAUserId: userId, pending2FAChallengeToken: challengeToken ?? null, pending2FAMethod: method, pending2FARememberMe: rememberMe }),
      clearPendingLogin2FA: () =>
        set({ pending2FAUserId: null, pending2FAChallengeToken: null, pending2FAMethod: "email", pending2FARememberMe: false }),
    }));
