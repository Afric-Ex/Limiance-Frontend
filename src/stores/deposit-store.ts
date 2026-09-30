import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A deposit stops counting as "in flight" after this long. On-chain credits can
 * wait on confirmations, so the window is generous — but it has to be finite,
 * otherwise a user who generated an address once would get a "deposit
 * successful" modal the next time their SOL balance moved for any reason.
 */
export const PENDING_DEPOSIT_TTL_MS = 24 * 60 * 60 * 1000;

export interface PendingDeposit {
  symbol: string;
  startedAt: number;
}

/** Shape of a `balance_update` frame as the server sends it. */
export interface BalanceUpdateFrame {
  balance_type?: string;
  delta?: number | string;
  new_balance?: number | string;
  reason?: string;
  symbol?: string;
  timestamp?: number;
}

/** A `balance_update` that has been attributed to one of the user's deposits. */
export interface DepositCredit {
  symbol: string;
  amount: number;
  newBalance: number;
  balanceType: string;
  timestamp: number;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normaliseSymbol = (value: unknown): string =>
  String(value ?? "").trim().toUpperCase();

export const isPendingActive = (
  entry: PendingDeposit,
  now: number = Date.now()
): boolean => now - entry.startedAt <= PENDING_DEPOSIT_TTL_MS;

/**
 * Decide whether a `balance_update` frame is the credit for a deposit the user
 * actually started.
 *
 * The frame alone can't tell a deposit from a trade settlement, a conversion or
 * an internal transfer — they all arrive as a positive delta on a balance. The
 * pending-deposit list is what makes the call: we only claim frames for a
 * symbol the user initiated a deposit on, and only while that deposit is still
 * inside its TTL.
 */
export function matchDepositCredit(
  frame: BalanceUpdateFrame,
  pending: PendingDeposit[],
  now: number = Date.now()
): DepositCredit | null {
  const delta = toNumber(frame?.delta);
  if (delta <= 0) return null;

  const symbol = normaliseSymbol(frame?.symbol);
  if (!symbol) return null;

  const entry = pending.find(
    (p) => normaliseSymbol(p?.symbol) === symbol && isPendingActive(p, now)
  );
  if (!entry) return null;

  const newBalance = toNumber(frame?.new_balance);

  return {
    symbol,
    amount: delta,
    newBalance: newBalance > 0 ? newBalance : delta,
    balanceType: String(frame?.balance_type ?? "").trim(),
    timestamp: toNumber(frame?.timestamp) || now,
  };
}

interface DepositState {
  pending: PendingDeposit[];
  /** Record that the user has opened a deposit for `symbol`. Idempotent per symbol. */
  markPending: (symbol: string) => void;
  clearPending: (symbol: string) => void;
  clearPendingAll: () => void;
  /**
   * If `frame` credits a deposit that is currently in flight, consume that
   * entry and return the credit. Returns null otherwise — including for a frame
   * that already matched, since the entry was removed on the first call.
   */
  claimCredit: (frame: BalanceUpdateFrame, now?: number) => DepositCredit | null;
}

export const useDepositStore = create<DepositState>()(
  persist(
    (set, get) => ({
      pending: [],

      markPending: (symbol) => {
        const key = normaliseSymbol(symbol);
        if (!key) return;
        const now = Date.now();
        set((state) => {
          const pruned = state.pending.filter(
            (p) => normaliseSymbol(p.symbol) !== key && isPendingActive(p, now)
          );
          return { pending: [...pruned, { symbol: key, startedAt: now }] };
        });
      },

      clearPending: (symbol) => {
        const key = normaliseSymbol(symbol);
        if (!key) return;
        set((state) => ({
          pending: state.pending.filter((p) => normaliseSymbol(p.symbol) !== key),
        }));
      },

      clearPendingAll: () => set({ pending: [] }),

      claimCredit: (frame, now) => {
        const at = now ?? Date.now();
        const { pending } = get();
        const credit = matchDepositCredit(frame, pending, at);
        if (!credit) return null;
        set((state) => ({
          pending: state.pending.filter(
            (p) => normaliseSymbol(p.symbol) !== credit.symbol
          ),
        }));
        return credit;
      },
    }),
    {
      name: "limiance-pending-deposits",
      partialize: (state) => ({ pending: state.pending }),
    }
  )
);
