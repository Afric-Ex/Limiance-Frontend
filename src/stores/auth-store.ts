import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  country: string;
  setCountry: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  otp: string;
  setOtp: (value: string) => void;
  pending2FAUserId: string | null;
  pending2FAChallengeToken: string | null;
  pending2FAMethod: "totp" | "email";
  pending2FARememberMe: boolean;
  setPendingLogin2FA: (userId: string, rememberMe: boolean, challengeToken?: string, method?: "totp" | "email") => void;
  clearPendingLogin2FA: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      rememberMe: false,
      country: "",
      setCountry: (value) => set({ country: value }),
      email: "",
      setEmail: (value) => set({ email: value }),
      otp: "",
      setOtp: (value) => set({ otp: value }),
      setRememberMe: (value) => set({ rememberMe: value }),
      pending2FAUserId: null,
      pending2FAChallengeToken: null,
      pending2FAMethod: "email",
      pending2FARememberMe: false,
      setPendingLogin2FA: (userId, rememberMe, challengeToken, method = "email") =>
        set({ pending2FAUserId: userId, pending2FAChallengeToken: challengeToken ?? null, pending2FAMethod: method, pending2FARememberMe: rememberMe }),
      clearPendingLogin2FA: () =>
        set({ pending2FAUserId: null, pending2FAChallengeToken: null, pending2FAMethod: "email", pending2FARememberMe: false }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        country: state.country,
        email: state.email,
        otp: state.otp,
        pending2FAUserId: state.pending2FAUserId,
        pending2FAChallengeToken: state.pending2FAChallengeToken,
        pending2FAMethod: state.pending2FAMethod,
        pending2FARememberMe: state.pending2FARememberMe,
      }),
    }
  )
);
