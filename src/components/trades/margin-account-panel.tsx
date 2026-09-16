"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { modals } from "@mantine/modals";
import { Tabs, TabsList, TabsTab, TabsPanel, Table, TableTh, TableTr, TableTd } from "@mantine/core";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { MarginBorrowRepayModal } from "./margin-borrow-repay-modal";
import { MarginTransferModal } from "./margin-transfer-modal";
import { MdOutlineVisibility, MdOutlineVisibilityOff, MdMoreVert, MdSearch } from "react-icons/md";
import clsx from "clsx";
import { Skeleton } from "@/src/components/shared/skeleton";
import { useDailyPnl } from "@/src/hooks/use-daily-pnl";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

interface Props {
  pair?: string;
  tradeMode: "cross" | "isolated";
  onTradeModeChange: (m: "cross" | "isolated") => void;
}

const modalStyles = {
  content: { backgroundColor: "#13151c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" },
  header: { backgroundColor: "transparent", padding: "16px 20px" },
  body:   { padding: "0 20px 20px" },
};

export function MarginAccountPanel({ pair = "BTC_USDT", tradeMode, onTradeModeChange }: Props) {
  const [hideBalances, setHideBalances] = useState(false);
  const [hideZero, setHideZero]         = useState(false);
  const [assetSearch, setAssetSearch]   = useState("");
  const [panelTab, setPanelTab]         = useState("funds");

  const parseNum = (v: any) => {
    if (!v) return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const fmt = (v: number, dp = 4) =>
    hideBalances ? "****" : v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

  // ── Data (WebSocket for live balance) ────────────────────────────────────
  const { balances, coins: portfolio, isLoading: portLoading, marginAccount } = usePortfolioWs();
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

  const { pnl, pnlPct } = useDailyPnl("margin");
  const isPnlPos     = pnl >= 0;

  // Real-time backend margin metrics from WS
  const fallbackTotalUsd = parseNum(balances?.margin?.inUsd ?? "0");
  const totalAssetsUsd = marginAccount && parseNum(marginAccount.total_assets_usd ?? marginAccount.totalAssetsUsd) > 0 ? parseNum(marginAccount.total_assets_usd ?? marginAccount.totalAssetsUsd) : fallbackTotalUsd;
  const totalLiabilitiesUsd = marginAccount ? parseNum(marginAccount.total_liability_usd ?? marginAccount.totalLiabilitiesUsd ?? marginAccount.totalLiabilityUsd) : 0;
  const equityUsd = marginAccount && parseNum(marginAccount.equity_usd ?? marginAccount.equityUsd ?? marginAccount.equity) > 0 ? parseNum(marginAccount.equity_usd ?? marginAccount.equityUsd ?? marginAccount.equity) : fallbackTotalUsd;

  const collateralUsd = totalUsd; // the base transfer balance
  
  const totalDebt    = totalLiabilitiesUsd;
  const marginLevel  = totalDebt > 0 ? totalAssetsUsd / totalDebt : 999;
  const accountEquity = equityUsd;

  const marginLevelColor =
    marginLevel >= 3     ? "text-green-400" :
    marginLevel >= 1.5   ? "text-yellow-400" : "text-red-400";

  const marginLevelLabel =
    marginLevel >= 999   ? "999.00" :
    marginLevel.toFixed(2);

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
    <div className="flex flex-col gap-4">

      {/* ── Top Bar: Mode Tabs + Actions ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Cross / Isolated toggle */}
        <div className="flex bg-white/[0.04] rounded-lg p-1 gap-1">
          {(["cross", "isolated"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onTradeModeChange(m)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-semibold transition-all capitalize",
                tradeMode === m
                  ? "bg-primary text-surface"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {m === "cross" ? "Cross Margin" : "Isolated Margin"}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openBorrow("borrow")}
            className="px-5 py-2 rounded-lg bg-primary text-surface text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Borrow
          </button>
          <button
            onClick={() => openBorrow("repay")}
            className="px-5 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-semibold hover:bg-white/10 transition-colors border border-white/[0.08]"
          >
            Repay
          </button>
          <button
            onClick={openTransfer}
            className="px-5 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-semibold hover:bg-white/10 transition-colors border border-white/[0.08]"
          >
            Transfer
          </button>
          <button className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
            <MdMoreVert size={18} />
          </button>
        </div>
      </div>

      {/* ── Info Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-3">

        {/* Total Balance + PnL */}
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 uppercase tracking-wide font-medium">Total Balance</span>
              <button onClick={() => setHideBalances(!hideBalances)} className="text-white/30 hover:text-white/60 transition-colors">
                {hideBalances ? <MdOutlineVisibilityOff size={14} /> : <MdOutlineVisibility size={14} />}
              </button>
            </div>
            {balLoading ? (
              <Skeleton variant="text" width="140px" height="32px" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tabular-nums">{fmt(totalUsd)}</span>
                <span className="text-sm text-white/50 font-medium">USDT</span>
              </div>
            )}
          </div>

          {/* Today's PnL sub-card */}
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg px-4 py-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wide font-medium mb-1.5">Today&apos;s PnL</p>
            <div className="flex items-center gap-2">
              <span className={clsx("text-sm font-semibold", isPnlPos ? "text-green-400" : "text-red-400")}>
                {hideBalances ? "****" : `${isPnlPos ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`}
              </span>
              <span className={clsx(
                "text-xs px-1.5 py-0.5 rounded font-semibold",
                isPnlPos ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
              )}>
                {hideBalances ? "***" : `${isPnlPos ? "+" : ""}${pnlPct.toFixed(2)}%`}
              </span>
            </div>
            <p className="text-[11px] text-white/30 mt-1">
              = ${hideBalances ? "****" : accountEquity.toFixed(4)} Available
            </p>
          </div>
        </div>

        {/* Margin Level + Collateral */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wide font-medium mb-2 flex items-center gap-2">
              <span className={clsx("w-2 h-2 rounded-full", marginLevel >= 3 ? "bg-green-400" : marginLevel >= 1.5 ? "bg-yellow-400" : "bg-red-400")} />
              Margin Level
            </p>
            {balLoading ? (
              <Skeleton variant="text" width="80px" height="28px" />
            ) : (
              <span className={clsx("text-2xl font-bold tabular-nums", marginLevelColor)}>
                {hideBalances ? "****" : marginLevelLabel}
              </span>
            )}
          </div>

          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wide font-medium mb-2">Collateral Value</p>
            {portLoading ? (
              <Skeleton variant="text" width="80px" height="24px" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white tabular-nums">{fmt(collateralUsd, 2)}</span>
                <span className="text-xs text-white/40">USDT</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Equity + Total Debt */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wide font-medium mb-2">Account Equity</p>
            {balLoading ? (
              <Skeleton variant="text" width="80px" height="24px" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white tabular-nums">{fmt(accountEquity, 2)}</span>
                <span className="text-xs text-white/40">USDT</span>
              </div>
            )}
          </div>

          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wide font-medium mb-2">Total Debt</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white tabular-nums">{fmt(totalDebt, 2)}</span>
              <span className="text-xs text-white/40">USDT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Funds / Positions Tabs ────────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden">
        <Tabs
          value={panelTab}
          onChange={(v) => setPanelTab(v ?? "funds")}
          classNames={{
            tab: "!pb-3 !pt-4 !px-4 hover:!bg-transparent data-[active]:!border-b-2 data-[active]:!border-primary data-[active]:!text-white !border-b-2 !border-transparent !rounded-none text-sm font-semibold text-white/40",
            list: "border-b border-white/[0.05] !px-2",
            panel: "!p-0",
          }}
        >
          <div className="flex items-center justify-between pr-4">
            <TabsList>
              <TabsTab value="funds">Funds</TabsTab>
              <TabsTab value="positions">Positions</TabsTab>
              <TabsTab value="borrow_history">Borrow History</TabsTab>
              <TabsTab value="liquidation_history">Liquidation History</TabsTab>
            </TabsList>

            {panelTab === "funds" && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hideZero}
                    onChange={(e) => setHideZero(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5"
                  />
                  Hide zero-balance assets
                </label>
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
          <TabsPanel value="funds">
            <div className="overflow-x-auto">
              <Table
                classNames={{
                  th: "!text-[10px] uppercase !text-white/40 !bg-transparent !py-3 first:!pl-5 !font-medium tracking-wide border-b border-white/[0.05]",
                  tr: "transition-colors hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0",
                  td: "!py-3.5 first:!pl-5 !text-sm",
                }}
              >
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
                      // Fetch image and name from portfolio matching coin
                      const pCoin = portfolio?.find(c => c.symbol === a.asset);
                      const bal      = parseNum(a.free) + parseNum(a.locked);
                      const avail    = parseNum(a.free);
                      const borrowed = parseNum(a.borrowed);
                      const interest = parseNum(a.interest);
                      return (
                        <TableTr key={a.asset}>
                          <TableTd>
                            <div className="flex items-center gap-2.5">
                              {pCoin?.image && (
                                <img src={pCoin.image} alt={a.asset} className="w-7 h-7 rounded-full bg-white/5" onError={(e) => { (e.target as any).style.display = "none"; }} />
                              )}
                              <div>
                                <p className="font-semibold text-white text-sm">{a.asset}</p>
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
                            <span className={borrowed > 0 ? "text-red-400 tabular-nums" : "text-white/50 tabular-nums"}>
                              {hideBalances ? "****" : borrowed.toFixed(6)}
                            </span>
                          </TableTd>
                          <TableTd>
                            <span className="text-white/50 tabular-nums">{hideBalances ? "****" : interest.toFixed(6)}</span>
                          </TableTd>
                          <TableTd>
                            <div className="flex items-center gap-3">
                              <button onClick={openTransfer} className="text-xs text-primary font-semibold hover:underline">Transfer</button>
                              <button onClick={() => openBorrow()} className="text-xs text-yellow-400 font-semibold hover:underline">Borrow</button>
                              {borrowed > 0 && (
                                <button onClick={() => openBorrow('repay')} className="text-xs text-emerald-400 font-semibold hover:underline">Repay</button>
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
          </TabsPanel>

          {/* Positions Tab */}
          <TabsPanel value="positions">
            <div className="overflow-x-auto">
              <Table
                classNames={{
                  th: "!text-[10px] uppercase !text-white/40 !bg-transparent !py-3 first:!pl-5 !font-medium tracking-wide border-b border-white/[0.05]",
                  tr: "transition-colors hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0",
                  td: "!py-3.5 first:!pl-5 !text-sm",
                }}
              >
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
                          <span className={clsx("text-xs font-bold uppercase", o.side === "buy" ? "text-green-400" : "text-red-400")}>
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
                            o.status === "filled"    ? "bg-green-400/15 text-green-400" :
                            o.status === "cancelled" ? "bg-red-400/15 text-red-400" :
                                                       "bg-white/10 text-white/50"
                          )}>{o.status ?? "open"}</span>
                        </TableTd>
                      </TableTr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </TabsPanel>
        <TabsPanel value="borrow_history">
            <div className="overflow-x-auto">
              <Table
                classNames={{
                  th: "!text-[10px] uppercase !text-white/40 !bg-transparent !py-3 first:!pl-5 !font-medium tracking-wide border-b border-white/[0.05]",
                  tr: "transition-colors hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0",
                  td: "!py-3.5 first:!pl-5 !text-sm",
                }}
              >
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
                            o.status === "repaid" || o.status === "completed" ? "bg-green-400/15 text-green-400" :
                            "bg-white/10 text-white/50"
                          )}>{o.status ?? "pending"}</span>
                        </TableTd>
                        <TableTd><span className="text-white/50 text-xs tabular-nums">{o.createdAt ? new Date(o.createdAt).toLocaleString() : o.time ? new Date(o.time).toLocaleString() : "—"}</span></TableTd>
                      </TableTr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </TabsPanel>

          {/* Liquidation History Tab */}
          <TabsPanel value="liquidation_history">
            <div className="overflow-x-auto">
              <Table
                classNames={{
                  th: "!text-[10px] uppercase !text-white/40 !bg-transparent !py-3 first:!pl-5 !font-medium tracking-wide border-b border-white/[0.05]",
                  tr: "transition-colors hover:bg-white/[0.02] border-b border-white/[0.03] last:border-0",
                  td: "!py-3.5 first:!pl-5 !text-sm",
                }}
              >
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
                          <span className={clsx("text-xs font-bold uppercase", o.side === "buy" || o.side === "long" ? "text-green-400" : "text-red-400")}>
                            {o.side}
                          </span>
                        </TableTd>
                        <TableTd><span className="text-white/90 tabular-nums">{o.size ?? o.amount ?? o.quantity}</span></TableTd>
                        <TableTd><span className="text-white/90 tabular-nums">{parseNum(o.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></TableTd>
                        <TableTd><span className="text-white/50 text-xs tabular-nums">{o.createdAt ? new Date(o.createdAt).toLocaleString() : o.time ? new Date(o.time).toLocaleString() : "—"}</span></TableTd>
                      </TableTr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </TabsPanel>
        </Tabs>
      </div>
    </div>
  );
}
