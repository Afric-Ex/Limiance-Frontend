"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { modals } from "@mantine/modals";
import { Checkbox, Table, TableTh, TableTr, TableTd } from "@mantine/core";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { MarginBorrowRepayModal } from "./margin-borrow-repay-modal";
import { MarginTransferModal } from "./margin-transfer-modal";
import { SegmentedControl } from "@/src/components/ui/segmented-control";
import { BalanceRevealControl } from "@/src/components/shared/balance-reveal-control";
import { useBalanceCloakStore } from "@/src/stores/balance-cloak-store";
import { useUserStore } from "@/src/stores/user-store";
import { MdRefresh, MdSearch } from "react-icons/md";
import clsx from "clsx";
import { Skeleton } from "@/src/components/shared/skeleton";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { getCryptoIcon } from "@/src/utils/crypto-icons";

interface Props {
  pair?: string;
  tradeMode: "cross" | "isolated";
  onTradeModeChange: (m: "cross" | "isolated") => void;
}

const modalStyles = {
  content: { backgroundColor: "#181a20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" },
  header: { backgroundColor: "transparent", padding: "16px 20px" },
  body:   { padding: "0 20px 20px" },
};

const tableClassNames = {
  table: "min-w-max",
  th: "!py-3 !px-3 first:!pl-5 !whitespace-nowrap !text-[11px] !font-medium !uppercase !tracking-wider !text-white/40 !border-b !border-white/[0.06] !bg-transparent",
  tr: "!border-b !border-white/[0.06] last:!border-0 hover:!bg-white/[0.02] !transition-colors",
  td: "!py-4 !px-3 first:!pl-5 !text-sm",
};

function formatDate(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  return s;
}

export function MarginAccountPanel({ pair = "BTC_USDT", tradeMode, onTradeModeChange }: Props) {
  const [hideZero, setHideZero]     = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [panelTab, setPanelTab]     = useState("funds");

  // Global balance cloak (shared with the rest of the app)
  const cloakEnabled = useBalanceCloakStore((s) => s.enabled);
  const legacyHide = useUserStore((s) => s.hideBalance);
  const hideBalances = cloakEnabled || legacyHide;

  const parseNum = (v: any) => {
    if (!v) return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const fmt = (v: number, dp = 4) =>
    hideBalances ? "****" : v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

  const isBuy = (side: unknown) => String(side ?? "").toUpperCase() === "BUY";

  // ── Data (WebSocket for live balance) ────────────────────────────────────
  // Margin panel: derived margin balance (from holdings) + the margin account
  // (borrowed funds, equity, leverage). No futures/allocations stream needed.
  const { balances, coins: portfolio, isLoading: portLoading, marginAccount, refreshBalances } = usePortfolioWs({
    coins: true,
    margin: true,
  });
  const marginBalance = balances["margin"];
  const balLoading = portLoading;

  const { data: openOrders } = useQuery({
    queryKey: tradingKeys.openOrders(),
    queryFn: () => tradingService.fetchMarginOpenOrders({}),
    select: (res: any) => res?.data ?? [],
    retry: false,
    throwOnError: false,
  });

  const { data: borrowHistory, isLoading: borrowLoading } = useQuery({
    queryKey: tradingKeys.marginBorrowHistory,
    queryFn: () => tradingService.marginBorrowHistory(),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []),
    retry: false,
    throwOnError: false,
  });

  const { data: liquidationHistory, isLoading: liquidationLoading } = useQuery({
    queryKey: tradingKeys.marginLiquidationHistory,
    queryFn: () => tradingService.marginLiquidationHistory(),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []),
    retry: false,
    throwOnError: false,
  });

  // ── Derived numbers ────────────────────────────────────────────────────────
  const totalUsd     = parseNum(marginBalance?.inUsd);

  // Server-provided 24h P&L. pnlPercentage is a fraction → ×100 for display.
  const pnl       = parseNum(marginBalance?.pnl ?? "0");
  const pnlPct    = parseNum(marginBalance?.pnlPercentage ?? "0") * 100;
  const isPnlPos  = pnl >= 0;

  // Real-time backend margin metrics from WS
  const fallbackTotalUsd = parseNum(balances?.margin?.inUsd ?? "0");
  const totalAssetsUsd = marginAccount && parseNum(marginAccount.total_assets_usd ?? marginAccount.totalAssetsUsd) > 0 ? parseNum(marginAccount.total_assets_usd ?? marginAccount.totalAssetsUsd) : fallbackTotalUsd;
  const totalLiabilitiesUsd = marginAccount ? parseNum(marginAccount.total_liability_usd ?? marginAccount.totalLiabilitiesUsd ?? marginAccount.totalLiabilityUsd) : 0;
  const equityUsd = marginAccount && parseNum(marginAccount.equity_usd ?? marginAccount.equityUsd ?? marginAccount.equity) > 0 ? parseNum(marginAccount.equity_usd ?? marginAccount.equityUsd ?? marginAccount.equity) : fallbackTotalUsd;

  const collateralUsd = totalUsd; // the base transfer balance

  const totalDebt    = totalLiabilitiesUsd;
  const marginLevel  = totalDebt > 0 ? totalAssetsUsd / totalDebt : 999;
  const accountEquity = equityUsd;

  const marginLevelTone =
    marginLevel >= 3     ? "success" :
    marginLevel >= 1.5   ? "warning" : "danger";

  const marginLevelColor =
    marginLevelTone === "success" ? "text-success-6" :
    marginLevelTone === "warning" ? "text-warning-1" : "text-error-1";

  const marginLevelLabel =
    marginLevel >= 999   ? "999.00" :
    marginLevel.toFixed(2);

  const marginLevelNote =
    marginLevelTone === "success" ? "Healthy" :
    marginLevelTone === "warning" ? "Under margin" : "Liquidation risk";

  // ── Filtered fund rows ─────────────────────────────────────────────────────
  // Use marginAccount.assets instead of portfolio because it includes borrowed funds
  const fundRows = (marginAccount?.assets ?? []).filter((a: any) => {
    const bal = parseNum(a.free);
    const locked = parseNum(a.locked);
    const borrowed = parseNum(a.borrowed);
    const total = bal + locked;

    if (hideZero && total === 0 && borrowed === 0) return false;
    if (assetSearch && !a.asset.toLowerCase().includes(assetSearch.toLowerCase())) return false;
    return true;
  });

  // ── Modal openers ─────────────────────────────────────────────────────────
  const openBorrow = (mode: "borrow" | "repay" = "borrow") => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      size: "lg",
      title: <span className="font-bold text-base text-white">Borrow / Repay Margin</span>,
      styles: modalStyles,
      children: <MarginBorrowRepayModal pair={pair} tradeMode={tradeMode} initialTab={mode} onClose={() => modals.closeAll()} />,
    });
  };

  const openTransfer = () =>
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      size: "lg",
      title: <span className="font-bold text-base text-white">Transfer Assets</span>,
      styles: modalStyles,
      children: <MarginTransferModal pair={pair} onClose={() => modals.closeAll()} />,
    });

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">

      {/* ── Top Bar: Mode Tabs + Actions ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SegmentedControl
          options={[
            { value: "cross", label: "Cross Margin" },
            { value: "isolated", label: "Isolated Margin" },
          ]}
          value={tradeMode}
          onChange={(m) => onTradeModeChange(m as "cross" | "isolated")}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => openBorrow("borrow")}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Borrow
          </button>
          <button
            onClick={() => openBorrow("repay")}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-muted active:scale-[0.98]"
          >
            Repay
          </button>
          <button
            onClick={openTransfer}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-muted active:scale-[0.98]"
          >
            Transfer
          </button>
        </div>
      </div>

      {/* ── Info Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Balance + PnL */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Total Balance</span>
            <div className="flex items-center gap-2">
              <BalanceRevealControl />
              <button
                type="button"
                onClick={refreshBalances}
                aria-label="Refresh margin account balances"
                title="Refresh balances"
                className="text-white/40 hover:text-white transition-colors"
              >
                <MdRefresh size={16} />
              </button>
            </div>
          </div>
          {balLoading ? (
            <Skeleton variant="text" width="120px" height="30px" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white tabular-nums leading-tight">{fmt(totalUsd)}</span>
              <span className="text-xs font-medium text-white/40">USDT</span>
            </div>
          )}
          <div className="mt-auto flex items-center gap-2">
            <span className="text-[11px] font-medium text-white/40">Today&apos;s PnL</span>
            {balLoading ? (
              <Skeleton variant="text" width="90px" height="14px" />
            ) : (
              <span className="flex items-center gap-1.5 text-xs">
                <span className={clsx("font-semibold", isPnlPos ? "text-success-6" : "text-error-1")}>
                  {hideBalances ? "****" : `${isPnlPos ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`}
                </span>
                <span className={clsx(
                  "px-1.5 py-0.5 rounded font-semibold",
                  isPnlPos ? "bg-success-6/10 text-success-6" : "bg-error-1/10 text-error-1"
                )}>
                  {hideBalances ? "***" : `${isPnlPos ? "+" : ""}${pnlPct.toFixed(2)}%`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Margin Level */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={clsx("w-2 h-2 rounded-full", marginLevelTone === "success" ? "bg-success-6" : marginLevelTone === "warning" ? "bg-warning-1" : "bg-error-1 animate-pulse")} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Margin Level</span>
          </div>
          {balLoading ? (
            <Skeleton variant="text" width="90px" height="30px" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className={clsx("text-2xl font-bold tabular-nums leading-tight", marginLevelColor)}>
                {hideBalances ? "****" : marginLevelLabel}
              </span>
              <span className="text-xs font-medium text-white/40">x</span>
            </div>
          )}
          <span className="mt-auto text-[11px] font-medium text-white/30">{marginLevelNote}</span>
        </div>

        {/* Account Equity + Collateral */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Account Equity</span>
            <button
              type="button"
              onClick={refreshBalances}
              aria-label="Refresh account equity"
              title="Refresh balances"
              className="text-white/40 hover:text-white transition-colors"
            >
              <MdRefresh size={16} />
            </button>
          </div>
          {balLoading ? (
            <Skeleton variant="text" width="90px" height="26px" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white tabular-nums leading-tight">{fmt(accountEquity, 2)}</span>
              <span className="text-xs font-medium text-white/40">USDT</span>
            </div>
          )}
          <span className="mt-auto text-[11px] text-white/40">
            Collateral <span className="font-semibold text-white/70">{fmt(collateralUsd, 2)}</span> USDT
          </span>
        </div>

        {/* Total Debt */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Total Debt</span>
            <button
              type="button"
              onClick={refreshBalances}
              aria-label="Refresh account debt"
              title="Refresh balances"
              className="text-white/40 hover:text-white transition-colors"
            >
              <MdRefresh size={16} />
            </button>
          </div>
          {balLoading ? (
            <Skeleton variant="text" width="90px" height="26px" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white tabular-nums leading-tight">{fmt(totalDebt, 2)}</span>
              <span className="text-xs font-medium text-white/40">USDT</span>
            </div>
          )}
          <span className="mt-auto text-[11px] text-white/40">Outstanding borrow + interest</span>
        </div>
      </div>

      {/* ── Funds / Positions Tabs ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-2 pr-4 max-[1150px]:flex-col max-[1150px]:items-stretch">
          <div className="min-w-0 max-[1150px]:-mx-2 max-[1150px]:overflow-x-auto max-[1150px]:px-2">
            <div className="flex w-max items-center gap-1 whitespace-nowrap">
              {[
                { value: "funds", label: "Funds" },
                { value: "positions", label: "Positions" },
                { value: "borrow_history", label: "Borrow History" },
                { value: "liquidation_history", label: "Liquidation History" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPanelTab(t.value)}
                  className={clsx(
                    "relative px-4 pt-4 pb-3 text-sm font-semibold transition-colors",
                    panelTab === t.value
                      ? "text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {t.label}
                  {panelTab === t.value && (
                    <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {panelTab === "funds" && (
            <div className="flex items-center gap-3 pb-2 max-[1150px]:w-full max-[1150px]:justify-between">
              <Checkbox
                classNames={{
                  root: "!shrink-0",
                  input: "!bg-transparent !border-white/20 checked:!bg-primary checked:!border-primary",
                  label: "!whitespace-nowrap !text-xs !text-white/40",
                }}
                label="Hide zero-balance assets"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
              />
              <div className="relative">
                <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                <input
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search"
                  className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary/40 w-28 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Funds Tab */}
        {panelTab === "funds" && (
          <div className="overflow-x-auto">
            <Table classNames={tableClassNames}>
              <thead>
                <TableTr>
                  <TableTh>Coin</TableTh>
                  <TableTh>Total Balance</TableTh>
                  <TableTh>Available Balance</TableTh>
                  <TableTh>Borrowed</TableTh>
                  <TableTh>Interest</TableTh>
                  <TableTh>Action</TableTh>
                </TableTr>
              </thead>
              <tbody>
                {portLoading ? (
                  <TableTr>
                    <TableTd colSpan={5}>
                      <div className="py-8 flex justify-center">
                        <Skeleton variant="table-row" count={4} columns={5} className="w-full" />
                      </div>
                    </TableTd>
                  </TableTr>
                ) : fundRows.length === 0 ? (
                  <TableTr>
                    <TableTd colSpan={5}>
                      <div className="py-10 flex flex-col items-center gap-2">
                        <p className="text-xs text-white/30">No assets in margin wallet</p>
                        <button onClick={openTransfer} className="text-xs text-primary hover:underline">Transfer funds to get started</button>
                      </div>
                    </TableTd>
                  </TableTr>
                ) : (
                  fundRows.map((a: any) => {
                    const pCoin = portfolio?.find(c => c.symbol === a.asset);
                    const bal      = parseNum(a.free) + parseNum(a.locked);
                    const avail    = parseNum(a.free);
                    const borrowed = parseNum(a.borrowed);
                    const interest = parseNum(a.interest);
                    return (
                      <TableTr key={a.asset}>
                        <TableTd>
                          <div className="flex items-center gap-2.5">
                            {getCryptoIcon(a.asset, pCoin?.image) ? (
                              <img src={getCryptoIcon(a.asset, pCoin?.image)} alt={a.asset} className="w-7 h-7 rounded-full object-cover shrink-0" onError={(e) => { (e.target as any).style.display = "none"; }} />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/80 shrink-0">
                                {a.asset?.charAt(0)}
                              </span>
                            )}
                            <div>
                              <p className="font-semibold text-white text-sm leading-tight">{a.asset}</p>
                              <p className="text-xs text-white/40">{pCoin?.name || a.asset}</p>
                            </div>
                          </div>
                        </TableTd>
                        <TableTd>
                          <span className="text-white/90 tabular-nums">{hideBalances ? "****" : bal.toFixed(6)}</span>
                        </TableTd>
                        <TableTd>
                          <span className="text-white/90 tabular-nums">{hideBalances ? "****" : avail.toFixed(6)}</span>
                        </TableTd>
                        <TableTd>
                          <span className={borrowed > 0 ? "text-error-1 tabular-nums" : "text-white/50 tabular-nums"}>
                            {hideBalances ? "****" : borrowed.toFixed(6)}
                          </span>
                        </TableTd>
                        <TableTd>
                          <span className="text-white/50 tabular-nums">{hideBalances ? "****" : interest.toFixed(6)}</span>
                        </TableTd>
                        <TableTd>
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <button onClick={openTransfer} className="text-xs font-semibold text-primary hover:underline">Transfer</button>
                            <button onClick={() => openBorrow()} className="text-xs font-semibold text-warning-1 hover:underline">Borrow</button>
                            {borrowed > 0 && (
                              <button onClick={() => openBorrow("repay")} className="text-xs font-semibold text-success-6 hover:underline">Repay</button>
                            )}
                          </div>
                        </TableTd>
                      </TableTr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* Positions Tab */}
        {panelTab === "positions" && (
          <div className="overflow-x-auto">
            <Table classNames={tableClassNames}>
              <thead>
                <TableTr>
                  <TableTh>Pair</TableTh>
                  <TableTh>Side</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh>Quantity</TableTh>
                  <TableTh>Leverage</TableTh>
                  <TableTh>Status</TableTh>
                </TableTr>
              </thead>
              <tbody>
                {!openOrders?.length ? (
                  <TableTr>
                    <TableTd colSpan={7}>
                      <div className="py-10 flex items-center justify-center">
                        <p className="text-xs text-white/30">No open margin positions</p>
                      </div>
                    </TableTd>
                  </TableTr>
                ) : (
                  openOrders.map((o: any, i: number) => (
                    <TableTr key={o.id ?? i}>
                      <TableTd><span className="font-semibold text-white">{o.pair ?? `${o.base}/${o.quote}`}</span></TableTd>
                      <TableTd>
                        <span className={clsx("text-xs font-bold uppercase", isBuy(o.side) ? "text-success-6" : "text-error-1")}>
                          {o.side}
                        </span>
                      </TableTd>
                      <TableTd><span className="text-white/70 capitalize">{o.type}</span></TableTd>
                      <TableTd><span className="text-white/90 tabular-nums">{parseNum(o.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></TableTd>
                      <TableTd><span className="text-white/90 tabular-nums">{o.amount ?? o.quantity}</span></TableTd>
                      <TableTd><span className="text-white/70">{o.leverage ? `${o.leverage}x` : "—"}</span></TableTd>
                      <TableTd>
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          String(o.status).toLowerCase() === "filled"    ? "bg-success-6/15 text-success-6" :
                          String(o.status).toLowerCase() === "cancelled" ? "bg-error-1/15 text-error-1" :
                                                                            "bg-white/10 text-white/50"
                        )}>{o.status ?? "open"}</span>
                      </TableTd>
                    </TableTr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* Borrow History Tab */}
        {panelTab === "borrow_history" && (
          <div className="overflow-x-auto">
            <Table classNames={tableClassNames}>
              <thead>
                <TableTr>
                  <TableTh>Asset</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Interest</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Time</TableTh>
                </TableTr>
              </thead>
              <tbody>
                {borrowLoading ? (
                  <TableTr><TableTd colSpan={5}><div className="py-8 flex justify-center"><Skeleton variant="table-row" count={3} columns={5} className="w-full" /></div></TableTd></TableTr>
                ) : !borrowHistory?.length ? (
                  <TableTr>
                    <TableTd colSpan={5}>
                      <div className="py-10 flex items-center justify-center">
                        <p className="text-xs text-white/30">No borrow history found</p>
                      </div>
                    </TableTd>
                  </TableTr>
                ) : (
                  borrowHistory.map((o: any, i: number) => (
                    <TableTr key={o.id ?? i}>
                      <TableTd><span className="font-semibold text-white">{o.asset ?? o.coin}</span></TableTd>
                      <TableTd><span className="text-white/90 tabular-nums">{parseNum(o.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></TableTd>
                      <TableTd><span className="text-white/70 tabular-nums">{parseNum(o.interest).toLocaleString("en-US", { minimumFractionDigits: 4 })}</span></TableTd>
                      <TableTd>
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                          String(o.status) === "repaid" || String(o.status) === "completed" ? "bg-success-6/15 text-success-6" :
                                                                                              "bg-white/10 text-white/50"
                        )}>{o.status ?? "pending"}</span>
                      </TableTd>
                      <TableTd><span className="text-white/50 text-xs tabular-nums">{formatDate(o.createdAt ?? o.time)}</span></TableTd>
                    </TableTr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

        {/* Liquidation History Tab */}
        {panelTab === "liquidation_history" && (
          <div className="overflow-x-auto">
            <Table classNames={tableClassNames}>
              <thead>
                <TableTr>
                  <TableTh>Pair</TableTh>
                  <TableTh>Side</TableTh>
                  <TableTh>Size</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh>Time</TableTh>
                </TableTr>
              </thead>
              <tbody>
                {liquidationLoading ? (
                  <TableTr><TableTd colSpan={5}><div className="py-8 flex justify-center"><Skeleton variant="table-row" count={3} columns={5} className="w-full" /></div></TableTd></TableTr>
                ) : !liquidationHistory?.length ? (
                  <TableTr>
                    <TableTd colSpan={5}>
                      <div className="py-10 flex items-center justify-center">
                        <p className="text-xs text-white/30">No liquidation history found</p>
                      </div>
                    </TableTd>
                  </TableTr>
                ) : (
                  liquidationHistory.map((o: any, i: number) => (
                    <TableTr key={o.id ?? i}>
                      <TableTd><span className="font-semibold text-white">{o.pair ?? o.symbol}</span></TableTd>
                      <TableTd>
                        <span className={clsx("text-xs font-bold uppercase", isBuy(o.side) || String(o.side) === "long" ? "text-success-6" : "text-error-1")}>
                          {o.side}
                        </span>
                      </TableTd>
                      <TableTd><span className="text-white/90 tabular-nums">{o.size ?? o.amount ?? o.quantity}</span></TableTd>
                      <TableTd><span className="text-white/90 tabular-nums">{parseNum(o.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></TableTd>
                      <TableTd><span className="text-white/50 text-xs tabular-nums">{formatDate(o.createdAt ?? o.time)}</span></TableTd>
                    </TableTr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}