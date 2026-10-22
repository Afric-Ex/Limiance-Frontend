"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMovers, type Movers } from "@/src/lib/landing/markets";

export const DEFAULT_SYMBOL = "BTC/USDT";
const POLL_MS = 15_000;

type MarketCtx = {
  symbol: string;
  setSymbol: (s: string) => void;
  movers: Movers | null;
  moversLoaded: boolean;
  /** Pairs a visitor can switch to: the default plus whatever the API lists as movers. */
  symbols: string[];
};

const Ctx = createContext<MarketCtx | null>(null);

export function useMarket() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMarket must be used inside <MarketProvider>");
  return c;
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [movers, setMovers] = useState<Movers | null>(null);
  const [moversLoaded, setMoversLoaded] = useState(false);

  useEffect(() => {
    let ctrl = new AbortController();
    const load = async () => {
      ctrl.abort();
      ctrl = new AbortController();
      try {
        setMovers(await fetchMovers(ctrl.signal));
      } catch (e) {
        if ((e as Error).name !== "AbortError") setMovers(null);
      } finally {
        setMoversLoaded(true);
      }
    };
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      window.clearInterval(id);
      ctrl.abort();
    };
  }, []);

  const symbols = useMemo(
    () =>
      Array.from(
        new Set([
          DEFAULT_SYMBOL,
          symbol,
          ...(movers?.gainers ?? []).map((m) => m.symbol),
          ...(movers?.losers ?? []).map((m) => m.symbol),
        ]),
      ),
    [movers, symbol],
  );

  const value = useMemo(
    () => ({ symbol, setSymbol, movers, moversLoaded, symbols }),
    [symbol, movers, moversLoaded, symbols],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}