import { create } from "zustand";
import { userService } from "../services/user";
import { errorMessageHandler } from "../lib/error-handler";
import { LoginResponse } from "../types/auth";

interface UserState {
  user: null | LoginResponse["data"];
  hideBalance: boolean;
  setUser: (value: LoginResponse["data"]) => void;
  setHideBalance: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  selectedCoinsHistory: string[];
  setSelectedCoinsHistory: (value: string[]) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()((set) => ({
      user: null,
      hideBalance: false,
      selectedCoinsHistory: [],
      loading: false,
      error: null,
      setUser: (value) => set({ user: value }),
      setHideBalance: (value) => set({ hideBalance: value }),
      setSelectedCoinsHistory: (value) => set({ selectedCoinsHistory: value }),
      reset: () => set({ user: null, hideBalance: false, selectedCoinsHistory: [], loading: false, error: null }),

      fetchUser: async () => {
        set({ loading: true, error: null });
        try {
          const userDetails = await userService.getUser();
          if (userDetails.data) {
            set((state) => ({ user: { ...state.user, ...userDetails.data }, loading: false }));
          } else {
            set({ loading: false });
          }
        } catch (error: any) {
          // Gracefully suppress the 500 Unimplemented error until the live backend is updated
          if (error?.response?.status === 500 && error?.response?.data?.error?.includes("Unimplemented")) {
            console.warn("Suppressing unimplemented /user_details backend error");
          } else {
            errorMessageHandler(error as any);
          }
          set({ error: "Failed to fetch user", loading: false });
        }
      },
    }));
