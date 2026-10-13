"use client";

import { api } from "@/src/lib/axios";
import { wsClient } from "@/src/lib/websocket-client";
import {
  normalizePortfolioCoins,
  deriveAccountBalances,
  type AccountBalance,
  type MarginAccountData,
  type PortfolioAllocations,
  type PortfolioCoin,
} from "@/src/lib/portfolio-utils";

/**
 * Demand-driven portfolio store.
 *
 * Every portfolio topic is ref-counted. A topic opens its WebSocket stream (and
 * its HTTP fallback where one exists) only while at least one mounted consumer declares it needs
 * that topic, and closes it as soon as the last consumer goes away. A page that
 * renders holdings therefore costs `get_portfolio` and any requested balance
 * streams — unrelated account and trading topics stay quiet until requested.
 *
 * State is module-level and shared, so N components reading the same topic share
 * one subscription and one copy of the data (previously each hook instance held
 * its own `useState`, so a dashboard mounting three of them opened three sets of
 * streams for one screen's worth of data).
 */

export type PortfolioTopic =
  | "portfolio"
  | "balance"
  | "fundingBalance"
  | "spotBalance"
  | "marginBalance"
  | "futuresBalance"
  | "allocations"
  | "margin"
  | "futures";

export const ALL_PORTFOLIO_TOPICS: PortfolioTopic[] = [
  "portfolio",
  "balance",
  "fundingBalance",
  "spotBalance",
  "marginBalance",
  "futuresBalance",
  "allocations",
  "margin",
  "futures",
];

export type PortfolioBalanceAccount = "funding" | "spot" | "margin" | "futures";

/** Which fields of the store a caller reads. Drives what gets subscribed. */
export interface PortfolioNeeds {
  /** Per-coin holdings (`get_portfolio`) → `coins` + derived per-account balances. */
  coins?: boolean;
  /** Overall balance + 24h P&L (`overall_portfolio_balance`) → `balances.total`. */
  balance?: boolean;
  /** Balance for one wallet returned by `get_portfolio_balance`. */
  balanceAccount?: PortfolioBalanceAccount;
  /** Allocation breakdown (`get_portfolio_balance_allocations`) → `allocations`. */
  allocations?: boolean;
  /** Margin account state (`get_margin_account`) → `marginAccount`. */
  margin?: boolean;
  /** Open futures positions (`get_futures_positions`) → `futuresPositions`. */
  futures?: boolean;
}

const TOPIC_OF_NEED: Record<Exclude<keyof PortfolioNeeds, "balanceAccount">, PortfolioTopic> = {
  coins: "portfolio",
  balance: "balance",
  allocations: "allocations",
  margin: "margin",
  futures: "futures",
};

const ACCOUNT_BALANCE_TOPIC: Record<PortfolioBalanceAccount, PortfolioTopic> = {
  funding: "fundingBalance",
  spot: "spotBalance",
  margin: "marginBalance",
  futures: "futuresBalance",
};

/** Request frame sent for each topic, and the topic its reply arrives on. */
const TOPIC_REQUEST: Record<PortfolioTopic, { topic: string; payload: object }> = {
  portfolio: {
    topic: "portfolio",
    payload: { type: "get_portfolio", data: { page: "1", limit: "100", query: "" } },
  },
  balance: {
    topic: "overall_portfolio_balance",
    payload: { type: "get_portfolio_balance", data: { account: "" } },
  },
  fundingBalance: {
    topic: "overall_portfolio_balance",
    payload: { type: "get_portfolio_balance", data: { account: "funding" } },
  },
  spotBalance: {
    topic: "overall_portfolio_balance",
    payload: { type: "get_portfolio_balance", data: { account: "spot" } },
  },
  marginBalance: {
    topic: "overall_portfolio_balance",
    payload: { type: "get_portfolio_balance", data: { account: "margin" } },
  },
  futuresBalance: {
    topic: "overall_portfolio_balance",
    payload: { type: "get_portfolio_balance", data: { account: "futures" } },
  },
  allocations: {
    topic: "portfolio_balance_allocations",
    payload: { type: "get_portfolio_balance_allocations", data: {} },
  },
  margin: {
    topic: "margin_account",
    payload: { type: "get_margin_account", data: {} },
  },
  futures: {
    topic: "futures_positions",
    payload: { type: "get_futures_positions", data: {} },
  },
};

/** REST equivalents where the API has a matching endpoint. */
const TOPIC_HTTP: Partial<Record<PortfolioTopic, () => Promise<any>>> = {
  portfolio: () => api.get("wallet/portfolio", { params: { limit: 100 } }),
  balance: () => api.get("wallet/balance"),
  allocations: () => api.get("wallet/balance_allocations"),
  margin: () => api.get("trading/margin/account"),
  futures: () => api.get("trading/futures/positions"),
};

/** How long a topic waits on the socket before falling back to REST. */
const WS_FALLBACK_DELAY_MS = 5000;
/** Minimum gap between REST fallbacks for one topic. */
const HTTP_THROTTLE_MS = 5000;

interface PortfolioStoreState {
  coins: PortfolioCoin[];
  balances: Record<string, AccountBalance>;
  allocations: PortfolioAllocations | null;
  marginAccount: MarginAccountData | null;
  futuresPositions: any[];
  isConnected: boolean;
  /** Per-topic pending flags — a topic nobody asked for is never pending. */
  pending: Record<PortfolioTopic, boolean>;
  /**
   * Per-topic "user asked to refresh" flags. True from the moment an explicit
   * refresh() fires a request until that topic's fresh data lands, so the UI
   * can spin a refresh icon. Unlike `pending`, these are skipped for topics
   * with cached data and only set by explicit refresh calls.
   */
  refreshing: Record<PortfolioTopic, boolean>;
}

const emptyState = (): PortfolioStoreState => ({
  coins: [],
  balances: {},
  allocations: null,
  marginAccount: null,
  futuresPositions: [],
  isConnected: false,
  pending: {
    portfolio: false,
    balance: false,
    fundingBalance: false,
    spotBalance: false,
    marginBalance: false,
    futuresBalance: false,
    allocations: false,
    margin: false,
    futures: false,
  },
  refreshing: {
    portfolio: false,
    balance: false,
    fundingBalance: false,
    spotBalance: false,
    marginBalance: false,
    futuresBalance: false,
    allocations: false,
    margin: false,
    futures: false,
  },
});

class PortfolioStore {
  private state: PortfolioStoreState = emptyState();
  private listeners = new Set<() => void>();

  /** topic -> number of mounted consumers currently needing it. */
  private refCounts: Record<PortfolioTopic, number> = {
    portfolio: 0,
    balance: 0,
    fundingBalance: 0,
    spotBalance: 0,
    marginBalance: 0,
    futuresBalance: 0,
    allocations: 0,
    margin: 0,
    futures: 0,
  };
  private unsubs: Partial<Record<PortfolioTopic, () => void>> = {};
  private fallbackTimers: Partial<Record<PortfolioTopic, ReturnType<typeof setTimeout>>> = {};
  private httpInFlight = new Set<PortfolioTopic>();
  private lastHttpAt: Record<PortfolioTopic, number> = {
    portfolio: 0,
    balance: 0,
    fundingBalance: 0,
    spotBalance: 0,
    marginBalance: 0,
    futuresBalance: 0,
    allocations: 0,
    margin: 0,
    futures: 0,
  };
  private unsubscribeStatus: (() => void) | null = null;

  // ── subscription ──────────────────────────────────────────────────────────

  getState = (): PortfolioStoreState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.state = { ...this.state };
    this.listeners.forEach((l) => l());
  }

  private setPending(topic: PortfolioTopic, pending: boolean) {
    if (this.state.pending[topic] === pending) return;
    this.state.pending = { ...this.state.pending, [topic]: pending };
    this.emit();
  }

  private setRefreshing(topic: PortfolioTopic, refreshing: boolean) {
    if (this.state.refreshing[topic] === refreshing) return;
    this.state.refreshing = { ...this.state.refreshing, [topic]: refreshing };
    this.emit();
  }

  /** Register one consumer's demand for a set of topics. Returns the matching release. */
  acquire(topics: PortfolioTopic[]): () => void {
    const unique = Array.from(new Set(topics));

    unique.forEach((topic) => {
      this.refCounts[topic] += 1;
      if (this.refCounts[topic] === 1) this.startTopic(topic);
    });

    let released = false;
    return () => {
      if (released) return;
      released = true;
      unique.forEach((topic) => {
        this.refCounts[topic] = Math.max(0, this.refCounts[topic] - 1);
        if (this.refCounts[topic] === 0) this.stopTopic(topic);
      });
      if (this.isIdle()) this.detachStatusListener();
    };
  }

  private isIdle(): boolean {
    return ALL_PORTFOLIO_TOPICS.every((t) => this.refCounts[t] === 0);
  }

  private startTopic(topic: PortfolioTopic) {
    if (this.unsubs[topic]) return; // already open

    // Only show a pending state when we have nothing to show yet; a re-acquire
    // with cached data renders instantly and refreshes behind the scenes.
    const hasCachedData = this.hasDataFor(topic);
    this.setPending(topic, !hasCachedData);

    if (!this.ensureStatusListener()) return;

    const { topic: responseTopic, payload } = TOPIC_REQUEST[topic];
    this.unsubs[topic] = wsClient.subscribe(responseTopic, payload, (raw, full) => {
      this.ingest(topic, full?.data?.data ?? full?.data ?? raw);
    });

    if (this.fallbackTimers[topic]) clearTimeout(this.fallbackTimers[topic]);
    this.fallbackTimers[topic] = setTimeout(() => {
      this.fallbackTimers[topic] = undefined;
      if (this.refCounts[topic] === 0) return;
      if (!this.hasDataFor(topic)) {
        console.warn(`[portfolio-ws] no "${topic}" data over WS — using HTTP fallback`);
        void this.fetchOverHttp(topic);
      }
    }, WS_FALLBACK_DELAY_MS);
  }

  private stopTopic(topic: PortfolioTopic) {
    if (this.fallbackTimers[topic]) {
      clearTimeout(this.fallbackTimers[topic]);
      this.fallbackTimers[topic] = undefined;
    }
    this.unsubs[topic]?.();
    delete this.unsubs[topic];
    this.setPending(topic, false);
    this.setRefreshing(topic, false);
  }

  private ensureStatusListener(): boolean {
    if (this.unsubscribeStatus) return true;
    this.unsubscribeStatus = wsClient.onStatusChange((connected) => {
      if (this.state.isConnected === connected) return;
      this.state.isConnected = connected;
      this.emit();
      // Socket dropped: pull every topic that is still on screen over REST.
      if (!connected) {
        ALL_PORTFOLIO_TOPICS.forEach((topic) => {
          if (this.refCounts[topic] > 0) void this.fetchOverHttp(topic);
        });
      }
    });
    return true;
  }

  private detachStatusListener() {
    this.unsubscribeStatus?.();
    this.unsubscribeStatus = null;
  }

  private hasDataFor(topic: PortfolioTopic): boolean {
    switch (topic) {
      case "portfolio":
        return this.state.coins.length > 0;
      case "balance":
        return this.state.balances.total != null;
      case "fundingBalance":
        return this.state.balances.funding != null;
      case "spotBalance":
        return this.state.balances.spot != null;
      case "marginBalance":
        return this.state.balances.margin != null;
      case "futuresBalance":
        return this.state.balances.futures != null;
      case "allocations":
        return this.state.allocations != null;
      case "margin":
        return this.state.marginAccount != null;
      case "futures":
        return this.state.futuresPositions.length > 0;
      default:
        return false;
    }
  }

  // ── data ingestion ────────────────────────────────────────────────────────

  private ingest(topic: PortfolioTopic, raw: any) {
    switch (topic) {
      case "portfolio": {
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        const items = normalizePortfolioCoins(list);
        if (items.length === 0) return;
        this.state.coins = items;
        this.state.balances = {
          ...this.state.balances,
          ...deriveAccountBalances(items),
        };
        break;
      }
      case "balance": {
        if (!raw || raw.inUsd === undefined) return;
        this.state.balances = {
          ...this.state.balances,
          total: {
            inUsd: raw.inUsd ?? "0",
            inBtc: raw.inBtc ?? "0",
            inNgn: raw.inNgn ?? "0",
            pnl: raw.pnl ?? "0",
            pnlPercentage: raw.pnlPercentage ?? "0",
            fundingBalance: raw.fundingBalance,
            unifiedTradingBalance: raw.unifiedTradingBalance,
          },
        };
        break;
      }
      case "fundingBalance":
      case "spotBalance":
      case "marginBalance":
      case "futuresBalance": {
        if (!raw || raw.inUsd === undefined) return;
        const account = topic.replace("Balance", "").toLowerCase();
        this.state.balances = {
          ...this.state.balances,
          [account]: {
            inUsd: raw.inUsd ?? "0",
            inBtc: raw.inBtc ?? "0",
            inNgn: raw.inNgn ?? "0",
            pnl: raw.pnl ?? "0",
            pnlPercentage: raw.pnlPercentage ?? "0",
          },
        };
        break;
      }
      case "allocations": {
        if (!raw || (raw.totalValue === undefined && !raw.allocations)) return;
        this.state.allocations = {
          totalValue: raw.totalValue ?? "0",
          allocations: Array.isArray(raw.allocations) ? raw.allocations : [],
        };
        break;
      }
      case "margin": {
        if (!raw || !raw.assets) return;
        this.state.marginAccount = raw as MarginAccountData;
        break;
      }
      case "futures": {
        if (!Array.isArray(raw)) return;
        this.state.futuresPositions = raw;
        break;
      }
    }
    this.setPending(topic, false);
    this.setRefreshing(topic, false);
    this.emit();
  }

  // ── REST fallback ─────────────────────────────────────────────────────────

  private async fetchOverHttp(topic: PortfolioTopic) {
    if (this.refCounts[topic] === 0) return;
    if (this.httpInFlight.has(topic)) return;
    if (Date.now() - this.lastHttpAt[topic] < HTTP_THROTTLE_MS) {
      // Throttled: still let the caller stop showing a skeleton.
      if (!this.hasDataFor(topic)) this.setPending(topic, false);
      return;
    }

    this.httpInFlight.add(topic);
    this.lastHttpAt[topic] = Date.now();
    try {
      const fetcher = TOPIC_HTTP[topic];
      if (!fetcher) return;
      const res = await fetcher();
      const body = res?.data;
      this.ingest(topic, body?.data?.data !== undefined ? body.data.data : body?.data ?? body);
    } catch {
      // Fall through to clearing pending — the caller shows an empty state
      // rather than an eternal spinner.
    } finally {
      this.httpInFlight.delete(topic);
      // No fresh data arrived — stop any refresh spinner for this topic too.
      this.setRefreshing(topic, false);
      if (this.refCounts[topic] > 0 && !this.hasDataFor(topic)) {
        this.setPending(topic, false);
      }
    }
  }

  // ── explicit refresh ──────────────────────────────────────────────────────

  /** Re-request only the topics that currently have a consumer. */
  refresh = (): void => {
    const wanted = ALL_PORTFOLIO_TOPICS.filter((t) => this.refCounts[t] > 0);
    if (wanted.length === 0) return;

    // Flip on the refresh indicator for every requested topic; it is cleared
    // as each topic's fresh snapshot arrives (or its REST fallback settles).
    wanted.forEach((topic) => this.setRefreshing(topic, true));

    if (wsClient.getIsConnected()) {
      wanted.forEach((topic) => wsClient.send(TOPIC_REQUEST[topic].payload));
    } else {
      wanted.forEach((topic) => void this.fetchOverHttp(topic));
    }
  };
}

export const portfolioStore = new PortfolioStore();

/** Map a caller's declared needs onto the topic list the store ref-counts. */
export const topicsForNeeds = (needs?: PortfolioNeeds): PortfolioTopic[] => {
  if (!needs) {
    return ["portfolio", "balance", "allocations", "margin", "futures"];
  }
  const topics = (Object.keys(TOPIC_OF_NEED) as Array<keyof typeof TOPIC_OF_NEED>)
    .filter((key) => needs[key])
    .map((key) => TOPIC_OF_NEED[key]);
  if (needs.balanceAccount) {
    topics.push(ACCOUNT_BALANCE_TOPIC[needs.balanceAccount]);
  } else {
    topics.push("balance");
  }
  return topics;
};
