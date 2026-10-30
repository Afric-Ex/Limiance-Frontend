import { create } from "zustand";
import { userService } from "../services/user";
import { errorMessageHandler } from "../lib/error-handler";
import { isInLoginGrace } from "../lib/login-grace";
import { LoginResponse } from "../types/auth";

interface UserState {
  user: null | LoginResponse["data"];
  hideBalance: boolean;
  setUser: (value: LoginResponse["data"]) => void;
  setHideBalance: (value: boolean) => void;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  selectedCoinsHistory: string[];
  setSelectedCoinsHistory: (value: string[]) => void;
  reset: () => void;
  justLoggedIn: boolean;
  setJustLoggedIn: (value: boolean) => void;
}

let fetchUserPromise: Promise<void> | null = null;

/**
 * A 401 immediately after login is usually the newly-set session cookie not
 * being attached yet (the cookie store and the first dashboard request race,
 * which mobile browsers lose more often). Retry once before deciding the
 * session is really gone. The global interceptor already leaves the session
 * alone during the login grace window, so this retry is what turns a timing
 * blip into a normal page load.
 */
const loadUserDetails = async () => {
  try {
    return await userService.getUser();
  } catch (error: any) {
    const status = error?.response?.status;
    const { justLoggedIn } = useUserStore.getState();
    if (status === 401 && (justLoggedIn || isInLoginGrace())) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return await userService.getUser();
    }
    throw error;
  }
};

export const useUserStore = create<UserState>()((set) => ({
      user: null,
      hideBalance: false,
      selectedCoinsHistory: [],
      loading: false,
      hydrated: false,
      error: null,
      justLoggedIn: false,
      setUser: (value) =>
        set({ user: value, hydrated: true, loading: false, error: null }),
      setHideBalance: (value) => set({ hideBalance: value }),
      setSelectedCoinsHistory: (value) => set({ selectedCoinsHistory: value }),
      setJustLoggedIn: (value) => set({ justLoggedIn: value }),
      reset: () => set({ user: null, hideBalance: false, selectedCoinsHistory: [], loading: false, hydrated: true, error: null, justLoggedIn: false }),

      fetchUser: () => {
        if (fetchUserPromise) return fetchUserPromise;

        fetchUserPromise = (async () => {
          set({ loading: true, error: null });
          try {
            const userDetails = await loadUserDetails();
            const data = userDetails?.data;
            if (data && typeof data === "object" && !Array.isArray(data)) {
              set((state) => ({
                user: { ...state.user, ...data },
                loading: false,
                hydrated: true,
                error: null,
              }));
            } else {
              set({ loading: false, hydrated: true });
            }
          } catch (error: any) {
            // Gracefully suppress the 500 Unimplemented error until the live backend is updated
            if (error?.response?.status === 500 && error?.response?.data?.error?.includes("Unimplemented")) {
              console.warn("Suppressing unimplemented /user_details backend error");
            } else if (error?.response?.status === 401 && useUserStore.getState().justLoggedIn) {
              // Just logged in but /user_details returned 401. This can happen with timing issues.
              // Don't trigger logout — just suppress the error and let the redirect to dashboard proceed.
              // The user will retry fetching on subsequent mounts.
              console.warn("Suppressing 401 on /user_details immediately after login");
              set({ justLoggedIn: false });
            } else {
              errorMessageHandler(error as any);
            }
            set({ error: "Failed to fetch user", loading: false, hydrated: true });
          }
        })().finally(() => {
          fetchUserPromise = null;
        });

        return fetchUserPromise;
      },
    }));
