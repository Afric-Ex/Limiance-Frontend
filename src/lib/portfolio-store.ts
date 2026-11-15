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

/**
 * Account tag each balance topic expects on incoming `overall_portfolio_balance`
 * frames. All five balance variants share one response topic, and the socket
 * client fans a frame out to every payload registered under that topic — so a
 * spot snapshot would otherwise also land in the overall-balance handler (and
 * vice versa), which is exactly the spot-vs-overall flip the wallets cards saw.
 */
const EXPECTED_BALANCE_ACCOUNT: Partial<Record<PortfolioTopic, string>> = {
  balance: "",
  fundingBalance: "funding",
  spotBalance: "spot",
  marginBalance: "margin",
  futuresBalance: "futures",
};

/**
 * The overall balance is requested with `account: ""` but the server tags the
 * reply `account: "overall"`. Normalize both so the account guard below does
 * not discard the very frame it is waiting for.
 */
const normalizeBalanceAccount = (account: string): string =>
  account === "overall" ? "" : account;

/**
 * Accept both camelCase (`inUsd`) and snake_case (`in_usd`) balance shapes.
 * Returns the input unchanged when it carries no balance fields at all, so the
 * caller's existing guards keep working.
 */
function normalizeBalancePayload(raw: any): any {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const inUsd = raw.inUsd ?? raw.in_usd;
  const inBtc = raw.inBtc ?? raw.in_btc;
  const inNgn = raw.inNgn ?? raw.in_ngn;
  const pnlPercentage = raw.pnlPercentage ?? raw.pnl_percentage ?? raw.pnlPercent;
  if (
    inUsd === undefined &&
    inBtc === undefined &&
    inNgn === undefined &&
    raw.pnl === undefined &&
    pnlPercentage === undefined &&
    raw.fundingBalance === undefined &&
    raw.unifiedTradingBalance === undefined
  ) {
    return raw;
  }
  return { ...raw, inUsd, inBtc, inNgn, pnl: raw.pnl, pnlPercentage };
}

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

/**
 * How long a topic waits for the socket to CONNECT before falling back to REST.
 * This is a connection-failure check only: a socket that is connected but slow
 * to answer never triggers REST. REST is used when (1) the socket can't connect,
 * (2) it drops, or (3) the topic's frame comes back as an error.
 */
const WS_CONNECT_GRACE_MS = 10_000;

/** True when a frame is the server reporting an error for the request. */
const isErrorFrame = (frame: any): boolean => {
  if (!frame || typeof frame !== "object") return false;
  const code = Number(frame.statusCode);
  return (
    frame.success === false ||
    (Number.isFinite(code) && code >= 400) ||
    (typeof frame.error === "string" && frame.error.trim() !== "")
  );
};
/** Minimum gap between REST fallbacks for one topic. */
const HTTP_THROTTLE_MS = 5000;

/**
 * What the UI should tell the user about a topic:
 *  - "delayed":     the socket is healthy but has not delivered a first frame yet
 *  - "stale":       we show the last known value, but it may have changed
 *  - "unavailable": we could not get data over WebSocket or HTTP
 */
export type TopicNotice = "delayed" | "stale" | "unavailable" | null;

/** On an explicit refresh, how long to wait for a healthy socket to answer before using HTTP. */
const REFRESH_WS_WAIT_MS = 5000;

/**
 * How long a connected socket may stay silent before we reassure the user that
 * we are still waiting for their data. Timed from the moment the socket becomes
 * connected (not from page load), so a slow handshake is never mistaken for a
 * slow stream. A normal sub-second load never flashes it.
 */
const SILENT_WS_NOTICE_MS = 10_000;

interface PortfolioStoreState {
  coins: PortfolioCoin[];
  balances: Record<string, AccountBalance>;
  allocations: PortfolioAllocations | null;
  marginAccount: MarginAccountData | null;
  futuresPositions: any[];
  isConnected: boolean;
  /** Per-topic notice for the UI (see TopicNotice). */
  notices: Record<PortfolioTopic, TopicNotice>;
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
  notices: {
    portfolio: null,
    balance: null,
    fundingBalance: null,
    spotBalance: null,
    marginBalance: null,
    futuresBalance: null,
    allocations: null,
    margin: null,
    futures: null,
  },
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

type HttpResult = "ok" | "failed" | "skipped";

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
  private httpPromises: Partial<Record<PortfolioTopic, Promise<HttpResult>>> = {};
  private wsWaiters: Partial<Record<PortfolioTopic, Array<(ok: boolean) => void>>> = {};
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
  /**
   * Timestamp of the last snapshot delivered over the socket per topic. The
   * HTTP fallback is gap-filler only: if a fresher socket snapshot lands while
   * a REST request is in flight, the stale REST response is dropped instead of
   * overwriting what the socket already displayed.
   */
  private lastWsAt: Record<PortfolioTopic, number> = {
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
  private refreshTimers: Partial<Record<PortfolioTopic, ReturnType<typeof setTimeout>>> = {};
  private refreshSeq: Record<PortfolioTopic, number> = {
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
  private silenceTimers: Partial<Record<PortfolioTopic, ReturnType<typeof setTimeout>>> = {};
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

  private setNotice(topic: PortfolioTopic, notice: TopicNotice) {
    if (this.state.notices[topic] === notice) return;
    this.state.notices = { ...this.state.notices, [topic]: notice };
    this.emit();
  }

  /**
   * Start (or restart) the "connected but silent" timer. If a healthy socket
   * still has not delivered data when it fires, surface a reassuring notice so
   * the card explains itself instead of spinning silently forever.
   */
  private armSilenceTimer(topic: PortfolioTopic) {
    if (this.refCounts[topic] === 0 || this.hasDataFor(topic)) return;
    if (this.silenceTimers[topic]) clearTimeout(this.silenceTimers[topic]);
    this.silenceTimers[topic] = setTimeout(() => {
      this.silenceTimers[topic] = undefined;
      if (this.refCounts[topic] === 0 || this.hasDataFor(topic)) return;
      if (!wsClient.getIsConnected()) return;
      // Never trample a stronger state ("unavailable" / "stale").
      if (this.state.notices[topic] === null) this.setNotice(topic, "delayed");
    }, SILENT_WS_NOTICE_MS);
  }

  private clearSilenceTimer(topic: PortfolioTopic) {
    if (this.silenceTimers[topic]) clearTimeout(this.silenceTimers[topic]);
    this.silenceTimers[topic] = undefined;
  }

  /** Resolve everyone waiting on this topic's socket reply (explicit refresh). */
  private settleWaiters(topic: PortfolioTopic, ok: boolean) {
    const list = this.wsWaiters[topic];
    if (!list || list.length === 0) return;
    this.wsWaiters[topic] = [];
    list.forEach((resolve) => resolve(ok));
  }

  private waitForWs(topic: PortfolioTopic, ms: number): Promise<boolean> {
    return new Promise((resolve) => {
      const done = (ok: boolean) => {
        clearTimeout(timer);
        resolve(ok);
      };
      const timer = setTimeout(() => {
        this.wsWaiters[topic] = (this.wsWaiters[topic] ?? []).filter((fn) => fn !== done);
        resolve(false);
      }, ms);
      (this.wsWaiters[topic] ??= []).push(done);
    });
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
      // Any frame ends a refresh wait — even one dropped below as irrelevant
      // or invalid. Otherwise a filtered-out snapshot leaves the spinner
      // rotating forever.
      this.setRefreshing(topic, false);
      // Balance variants share the `overall_portfolio_balance` response topic,
      // and the socket client fans one frame out to every payload under it.
      // Drop frames tagged for a different account so a spot snapshot can never
      // land in the overall-balance slot (or vice versa).
      const container = (full as any)?.data ?? raw;
      const inner = (container as any)?.data ?? container;
      const frameAccount =
        typeof (container as any)?.account === "string"
          ? (container as any).account
          : typeof (raw as any)?.account === "string"
            ? (raw as any).account
            : undefined;
      const expected = EXPECTED_BALANCE_ACCOUNT[topic];
      if (
        expected !== undefined &&
        frameAccount !== undefined &&
        normalizeBalanceAccount(frameAccount) !== normalizeBalanceAccount(expected)
      ) {
        return;
      }
      // This frame is for our topic, so the stream is alive: stop waiting and
      // retract the "still fetching" reassurance.
      this.clearSilenceTimer(topic);
      if (this.state.notices[topic] === "delayed") this.setNotice(topic, null);
      // The event came back as an error: this is the one case (besides a dead
      // socket) where REST is allowed to fill in.
      if (isErrorFrame(container) || isErrorFrame(raw)) {
        console.warn(`[portfolio-ws] "${topic}" returned an error frame — using HTTP fallback`, container);
        this.settleWaiters(topic, false);
        void this.fetchOverHttp(topic);
        return;
      }
      this.lastWsAt[topic] = Date.now();
      const ingested = this.ingest(topic, normalizeBalancePayload(inner) ?? inner);
      this.settleWaiters(topic, ingested);
    });

    if (this.fallbackTimers[topic]) clearTimeout(this.fallbackTimers[topic]);
    // Only fall back if the socket never connects. Connected-but-slow is NOT a failure.
    this.fallbackTimers[topic] = setTimeout(() => {
      this.fallbackTimers[topic] = undefined;
      if (this.refCounts[topic] === 0) return;
      if (!wsClient.getIsConnected() && !this.hasDataFor(topic)) {
        console.warn(`[portfolio-ws] socket not connected for "${topic}" — using HTTP fallback`);
        void this.fetchOverHttp(topic);
      }
    }, WS_CONNECT_GRACE_MS);

    // If the socket is already up, start the silence countdown now.
    if (wsClient.getIsConnected()) this.armSilenceTimer(topic);
  }

  private stopTopic(topic: PortfolioTopic) {
    if (this.fallbackTimers[topic]) {
      clearTimeout(this.fallbackTimers[topic]);
      this.fallbackTimers[topic] = undefined;
    }
    this.clearSilenceTimer(topic);
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
      if (connected) {
        // Socket is up: watch for topics that are connected but still silent.
        ALL_PORTFOLIO_TOPICS.forEach((topic) => {
          if (this.refCounts[topic] > 0) this.armSilenceTimer(topic);
        });
      } else {
        // Socket dropped: a "delayed" reassurance no longer applies, and every
        // topic still on screen falls back to REST.
        ALL_PORTFOLIO_TOPICS.forEach((topic) => {
          this.clearSilenceTimer(topic);
          if (this.state.notices[topic] === "delayed") this.setNotice(topic, null);
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

  /** Returns true when `raw` was a usable payload for this topic. */
  private ingest(topic: PortfolioTopic, raw: any): boolean {
    switch (topic) {
      case "portfolio": {
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        const items = normalizePortfolioCoins(list);
        if (items.length === 0) {
          // A valid but empty list (new account) is still a good answer.
          this.setNotice(topic, null);
          return Array.isArray(list);
        }
        this.state.coins = items;
        this.state.balances = {
          ...this.state.balances,
          ...deriveAccountBalances(items),
        };
        break;
      }
      case "balance": {
        if (!raw || raw.inUsd === undefined) return false;
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
        if (!raw || raw.inUsd === undefined) return false;
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
        if (!raw || (raw.totalValue === undefined && !raw.allocations)) return false;
        this.state.allocations = {
          totalValue: raw.totalValue ?? "0",
          allocations: Array.isArray(raw.allocations) ? raw.allocations : [],
        };
        break;
      }
      case "margin": {
        if (!raw || !raw.assets) return false;
        this.state.marginAccount = raw as MarginAccountData;
        break;
      }
      case "futures": {
        if (!Array.isArray(raw)) return false;
        this.state.futuresPositions = raw;
        break;
      }
    }
    this.setPending(topic, false);
    this.setRefreshing(topic, false);
    this.state.notices = { ...this.state.notices, [topic]: null };
    this.emit();
    return true;
  }

  // ── REST fallback ─────────────────────────────────────────────────────────

  /**
   * HTTP request for one topic. Resolves "ok" when fresh data was applied,
   * "failed" when HTTP could not provide it, and "skipped" when no request was
   * needed (throttled, nobody is watching, or a newer socket snapshot won).
   */
  private fetchOverHttp(topic: PortfolioTopic, opts: { force?: boolean } = {}): Promise<HttpResult> {
    if (this.refCounts[topic] === 0) return Promise.resolve("skipped");
    const inFlight = this.httpPromises[topic];
    if (inFlight) return inFlight;

    if (!opts.force && Date.now() - this.lastHttpAt[topic] < HTTP_THROTTLE_MS) {
      // Throttled: no request is servicing this refresh, so nothing else will
      // clear its spinner - drop it here along with the skeleton.
      if (!this.hasDataFor(topic)) this.setPending(topic, false);
      this.setRefreshing(topic, false);
      return Promise.resolve("skipped");
    }

    this.lastHttpAt[topic] = Date.now();
    const fetchStartedAt = this.lastHttpAt[topic];

    const run = async (): Promise<HttpResult> => {
      const fetcher = TOPIC_HTTP[topic];
      if (!fetcher) return "skipped";
      try {
        const res = await fetcher();
        if (this.lastWsAt[topic] > fetchStartedAt) {
          // A fresher snapshot arrived over the socket while this request was in
          // flight - keep what the socket displayed. HTTP stays a gap-filler.
          return "skipped";
        }
        const body = res?.data;
        const ok = this.ingest(topic, body?.data?.data !== undefined ? body.data.data : body?.data ?? body);
        return ok ? "ok" : "failed";
      } catch {
        return "failed";
      }
    };

    const promise = run()
      .then((result) => {
        // We had to use HTTP and it did not work: tell the user, never show a made-up value.
        if (result === "failed") {
          this.setNotice(topic, this.hasDataFor(topic) ? "stale" : "unavailable");
        }
        return result;
      })
      .finally(() => {
        delete this.httpPromises[topic];
        this.setRefreshing(topic, false);
        if (this.refCounts[topic] > 0 && !this.hasDataFor(topic)) {
          this.setPending(topic, false);
        }
      });
    this.httpPromises[topic] = promise;
    return promise;
  }

  // ── explicit refresh ──────────────────────────────────────────────────────

  /**
   * Refresh topics that currently have a consumer (optionally just `only`).
   *
   * Order of attempts, per topic:
   *   1. Socket healthy -> ask over the socket and wait for its reply.
   *   2. Socket unhealthy, or it did not answer / returned an error -> HTTP.
   *   3. HTTP failed too -> notice "unavailable" ("technical issues, try later").
   */
  refresh = (only?: PortfolioTopic[]): void => {
    const wanted = ALL_PORTFOLIO_TOPICS.filter(
      (t) => this.refCounts[t] > 0 && (!only || only.length === 0 || only.includes(t))
    );
    if (wanted.length === 0) return;

    wanted.forEach((topic) => {
      this.setRefreshing(topic, true);
      // Safety net: a refresh must never spin forever.
      const seq = (this.refreshSeq[topic] += 1);
      if (this.refreshTimers[topic]) clearTimeout(this.refreshTimers[topic]);
      this.refreshTimers[topic] = setTimeout(() => {
        this.refreshTimers[topic] = undefined;
        if (this.refreshSeq[topic] === seq) this.setRefreshing(topic, false);
      }, 20_000);
      void this.refreshTopic(topic);
    });
  };

  private async refreshTopic(topic: PortfolioTopic) {
    if (wsClient.getIsConnected() && wsClient.send(TOPIC_REQUEST[topic].payload)) {
      const gotFreshData = await this.waitForWs(topic, REFRESH_WS_WAIT_MS);
      if (gotFreshData) {
        this.setRefreshing(topic, false);
        return;
      }
    }
    const result = await this.fetchOverHttp(topic, { force: true });
    if (result === "failed") this.setNotice(topic, "unavailable");
    this.setRefreshing(topic, false);
  }
}

export const portfolioStore = new PortfolioStore();

/**
 * Map a caller's declared needs onto the topic list the store ref-counts.
 *
 * Only topics the caller explicitly declares are subscribed. In particular the
 * overall `balance` topic is added solely when `needs.balance` is set — a call
 * like `{ coins: true }` must not also open the overall-balance stream, or
 * every holdings table would re-request `account: ""` alongside the page's
 * real balance topic and the two snapshots would race each other.
 */
export const topicsForNeeds = (needs?: PortfolioNeeds): PortfolioTopic[] => {
  if (!needs) {
    return ["portfolio", "balance", "allocations", "margin", "futures"];
  }
  const topics = (Object.keys(TOPIC_OF_NEED) as Array<keyof typeof TOPIC_OF_NEED>)
    .filter((key) => needs[key])
    .map((key) => TOPIC_OF_NEED[key]);
  if (needs.balanceAccount) {
    topics.push(ACCOUNT_BALANCE_TOPIC[needs.balanceAccount]);
  }
  return topics;
};
