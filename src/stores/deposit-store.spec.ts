import { describe, expect, it, beforeEach } from "vitest";
import {
  matchDepositCredit,
  useDepositStore,
  PENDING_DEPOSIT_TTL_MS,
  type BalanceUpdateFrame,
  type PendingDeposit,
} from "./deposit-store";

const NOW = 1_700_000_000_000;

const frame = (over: Partial<BalanceUpdateFrame> = {}): BalanceUpdateFrame => ({
  balance_type: "funding_balance",
  delta: 0.49910412,
  new_balance: 0.49910412,
  reason: "balance_update",
  symbol: "SOL",
  timestamp: NOW,
  ...over,
});

const pending = (over: Partial<PendingDeposit> = {}): PendingDeposit => ({
  symbol: "SOL",
  startedAt: NOW - 60_000,
  ...over,
});

describe("matchDepositCredit", () => {
  it("claims a credit for a symbol with a deposit in flight", () => {
    const credit = matchDepositCredit(frame(), [pending()], NOW);
    expect(credit).toEqual({
      symbol: "SOL",
      amount: 0.49910412,
      newBalance: 0.49910412,
      balanceType: "funding_balance",
      timestamp: NOW,
    });
  });

  it("matches the symbol case-insensitively, as the deposit flow stores it", () => {
    expect(matchDepositCredit(frame({ symbol: "sol" }), [pending({ symbol: "SOL" })], NOW)).not.toBeNull();
    expect(matchDepositCredit(frame({ symbol: "SOL" }), [pending({ symbol: "sol" })], NOW)).not.toBeNull();
  });

  it("ignores a credit for a symbol with no deposit in flight", () => {
    expect(matchDepositCredit(frame(), [pending({ symbol: "USDT" })], NOW)).toBeNull();
  });

  it("ignores a credit once the pending deposit has expired", () => {
    const stale = pending({ startedAt: NOW - PENDING_DEPOSIT_TTL_MS - 1 });
    expect(matchDepositCredit(frame(), [stale], NOW)).toBeNull();
  });

  it("keeps a credit inside the ttl window", () => {
    const recent = pending({ startedAt: NOW - PENDING_DEPOSIT_TTL_MS + 1 });
    expect(matchDepositCredit(frame(), [recent], NOW)).not.toBeNull();
  });

  it("ignores withdrawals — a negative delta is never a deposit", () => {
    expect(matchDepositCredit(frame({ delta: -0.5 }), [pending()], NOW)).toBeNull();
  });

  it("ignores a zero delta", () => {
    expect(matchDepositCredit(frame({ delta: 0 }), [pending()], NOW)).toBeNull();
  });

  it("ignores a frame with no symbol", () => {
    expect(matchDepositCredit(frame({ symbol: "" }), [pending()], NOW)).toBeNull();
  });

  it("ignores a non-numeric delta rather than treating it as a credit", () => {
    expect(matchDepositCredit(frame({ delta: "abc" }), [pending()], NOW)).toBeNull();
  });

  it("accepts a string delta, since JSON numbers can arrive as strings", () => {
    const credit = matchDepositCredit(frame({ delta: "0.25", new_balance: "1.25" }), [pending()], NOW);
    expect(credit?.amount).toBe(0.25);
    expect(credit?.newBalance).toBe(1.25);
  });

  it("falls back to the delta when new_balance is absent", () => {
    const credit = matchDepositCredit(frame({ new_balance: undefined }), [pending()], NOW);
    expect(credit?.newBalance).toBe(0.49910412);
  });
});

describe("useDepositStore.claimCredit", () => {
  beforeEach(() => {
    localStorage.clear();
    useDepositStore.getState().clearPendingAll();
  });

  it("consumes the pending entry so the same credit cannot fire twice", () => {
    useDepositStore.getState().markPending("SOL");

    expect(useDepositStore.getState().claimCredit(frame(), NOW)).not.toBeNull();
    expect(useDepositStore.getState().pending).toHaveLength(0);
    expect(useDepositStore.getState().claimCredit(frame(), NOW)).toBeNull();
  });

  it("leaves other symbols pending when one is claimed", () => {
    useDepositStore.getState().markPending("SOL");
    useDepositStore.getState().markPending("USDT");

    useDepositStore.getState().claimCredit(frame(), NOW);

    const remaining = useDepositStore.getState().pending;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].symbol).toBe("USDT");
  });

  it("does not resurrect an expired entry", () => {
    useDepositStore.getState().markPending("SOL");
    const later = Date.now() + PENDING_DEPOSIT_TTL_MS + 1;

    expect(useDepositStore.getState().claimCredit(frame(), later)).toBeNull();
    expect(useDepositStore.getState().pending).toHaveLength(1);
  });

  it("markPending replaces the previous entry for the same symbol rather than duplicating it", () => {
    useDepositStore.getState().markPending("SOL");
    useDepositStore.getState().markPending("sol");

    expect(useDepositStore.getState().pending).toHaveLength(1);
    expect(useDepositStore.getState().pending[0].symbol).toBe("SOL");
  });

  it("markPending ignores a blank symbol", () => {
    useDepositStore.getState().markPending("   ");
    expect(useDepositStore.getState().pending).toHaveLength(0);
  });
});
