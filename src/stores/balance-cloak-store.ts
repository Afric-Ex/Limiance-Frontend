import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useUserStore } from "./user-store";

interface BalanceCloakState {
  enabled: boolean;
  toggleCloak: () => void;
  setEnabled: (value: boolean) => void;
}

const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // private browsing fallback — silently ignore
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useBalanceCloakStore = create<BalanceCloakState>()(
  persist(
    (set, get) => ({
      enabled: false,
      toggleCloak: () => {
        const current = get().enabled;
        let legacy = false;
        try {
          legacy = useUserStore.getState().hideBalance;
        } catch {
          legacy = false;
        }
        const effective = current || legacy;
        const next = !effective;
        try {
          useUserStore.getState().setHideBalance(next);
        } catch {
          // ignore
        }
        set({ enabled: next });
      },
      setEnabled: (value) => {
        try {
          useUserStore.getState().setHideBalance(value);
        } catch {
          // ignore
        }
        set({ enabled: value });
      },
    }),
    {
      name: "balance-cloak-enabled",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ enabled: state.enabled }),
    }
  )
);

export const useBalanceCloak = () => {
  const enabled = useBalanceCloakStore((s) => s.enabled);
  const toggleCloak = useBalanceCloakStore((s) => s.toggleCloak);
  return { enabled, toggleCloak };
};
