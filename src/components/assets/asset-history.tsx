"use client";

import { useMemo, useState } from "react";
import {
  Select,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@mantine/core";
import { MdOutlineHistory } from "react-icons/md";
import classes from "@/src/styles/assets-margin.module.css";
import { useInfiniteList } from "@/src/hooks/use-infinite-list";
import { asset, assetKeys } from "@/src/services/asset";
import { fiatKeys, fiatService } from "@/src/services/fiat";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";
import { InfiniteScrollTrigger } from "@/src/components/shared/infinite-scroll-trigger";
import {
  FilterBar,
  fmtDateTime,
  fmtNum,
  selectStyles,
  StatusPill,
  TableCard,
  tableClassNames,
} from "@/src/components/orders/orders-shared";
import { isZeroAddress, truncateCryptoAddress } from "@/src/utils/truncate-address";
import { formatTransactionAsset } from "@/src/utils/transaction";
import { rowTypeLabel, withdrawalMethodKind } from "@/src/utils/asset-history";

const LIMIT = 30;

const TABS = [
  { id: "transactions", label: "Transactions" },
  { id: "deposit", label: "Deposit" },
  { id: "withdraw", label: "Withdraw" },
  { id: "transfers", label: "Transfers" },
  { id: "p2p", label: "P2P" },
  { id: "fiat-deposit", label: "Fiat Deposit" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type WalletFlowTab = Exclude<TabId, "fiat-deposit">;

type HistoryTransactionType = "deposit" | "withdrawal" | "internal" | "p2p";

/**
 * Every wallet-flow tab reads `wallet/user/transactions_history`, filtered by
 * the tab's `transaction_type`. "transactions" deliberately maps to no value —
 * omitting the param is what returns the unfiltered list.
 */
const TAB_TRANSACTION_TYPE: Partial<Record<WalletFlowTab, HistoryTransactionType>> = {
  deposit: "deposit",
  withdraw: "withdrawal",
  transfers: "internal",
  p2p: "p2p",
};

const EMPTY_TITLES: Record<TabId, string> = {
  transactions: "No transactions yet",
  deposit: "No deposit transactions yet",
  withdraw: "No withdrawal transactions yet",
  transfers: "No transfer transactions yet",
  p2p: "No P2P transactions yet",
  "fiat-deposit": "No fiat deposits yet",
};

const TYPE_LABELS: Record<string, string> = {
  p2p: "P2P",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  internal: "Internal transfer",
  conversion: "Conversion",
};

/** Truncated addresses keep their original case; tickers are upper-cased. */
const displayTicker = (value: string): string =>
  value.startsWith("0x") ? value : value.toUpperCase();

/** Coin cell: shows the route (`BTC → LIM`) when the two legs differ. */
const rowCoinLabel = (row: Record<string, any>): string => {
  const chain = row.chain ?? row.network;
  const from = displayTicker(formatTransactionAsset(row.fromAsset ?? row.asset, chain));
  const to = displayTicker(formatTransactionAsset(row.toAsset, chain));
  if (!to || to === from) return from || to || "—";
  return `${from} → ${to}`;
};

/** Primary ticker for a row, used by the withdraw tab's token filter. */
const rowSymbolLabel = (row: Record<string, any>): string =>
  displayTicker(
    formatTransactionAsset(
      row.fromAsset ?? row.asset ?? row.coin ?? row.symbol ?? row.currency,
      row.chain ?? row.network
    )
  );

const rowTypeDisplay = (row: Record<string, any>): string => {
  const label = rowTypeLabel(row);
  if (!label) return "—";
  const key = label.toLowerCase();
  const base = TYPE_LABELS[key] ?? label;
  const meta = String(row.metadata ?? "").trim().toLowerCase();
  if (key === "p2p" && (meta === "buy" || meta === "sell")) {
    return `${base} · ${meta === "buy" ? "Buy" : "Sell"}`;
  }
  return base;
};

const BALANCE_LABELS: Record<string, string> = {
  spot_balance: "Spot",
  funding_balance: "Funding",
  locked_balance: "Locked",
};

const partyLabel = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw || isZeroAddress(raw)) return "";
  const bucket = BALANCE_LABELS[raw.toLowerCase()];
  if (bucket) return bucket;
  return raw.length > 20 ? truncateCryptoAddress(raw) : raw;
};

/**
 * Where the money moved: `locked_balance → funding_balance` becomes
 * "Locked → Funding". On-chain legs carry an address in the balance fields,
 * which truncates to the usual short form.
 */
const rowRouteLabel = (row: Record<string, any>): string => {
  const from = partyLabel(row.fromBalance ?? row.from ?? row.fromUserId);
  const to = partyLabel(
    row.toBalance ?? row.to ?? row.toUserId ?? row.destinationAddress
  );
  if (!from && !to) return "—";
  if (!from || !to) return from || to;
  return from === to ? from : `${from} → ${to}`;
};

const HistoryTable = ({ tab }: { tab: WalletFlowTab }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [tokenFilter, setTokenFilter] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState<"all" | "onchain" | "internal">("all");

  const withFilters = tab === "withdraw";
  const transactionType = TAB_TRANSACTION_TYPE[tab];
  const filters = transactionType ? { transaction_type: transactionType } : {};

  const {
    items,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    loadedCount,
    isError,
    refetch,
    fetchNextPage,
  } = useInfiniteList({
    queryKey: assetKeys.transactionHistoryList({ transactionType }),
    limit: LIMIT,
    filters,
    fetchPage: (params) => asset.transactionHistory(params),
  });

  // Token choices come from the rows the tab already fetched, so the filter can
  // never offer a value that matches nothing.
  const tokenOptions = useMemo(() => {
    if (!withFilters) return [] as string[];
    const seen = new Set<string>();
    for (const row of items) {
      const symbol = rowSymbolLabel(row);
      if (symbol) seen.add(symbol);
    }
    return Array.from(seen).sort();
  }, [items, withFilters]);

  const rows = useMemo(() => {
    if (!withFilters) return items;
    return items.filter((row) => {
      if (tokenFilter && rowSymbolLabel(row) !== tokenFilter) return false;
      if (methodFilter !== "all" && withdrawalMethodKind(row) !== methodFilter) {
        return false;
      }
      return true;
    });
  }, [items, withFilters, tokenFilter, methodFilter]);

  const filtersActive = !!tokenFilter || methodFilter !== "all";

  return (
    <div className="flex flex-col gap-4">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      {withFilters && (
        <FilterBar>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Token"
              placeholder="All tokens"
              classNames={selectStyles}
              className="w-[170px]"
              data={tokenOptions}
              value={tokenFilter}
              onChange={setTokenFilter}
              searchable
              clearable
              disabled={tokenOptions.length === 0}
            />
            <Select
              label="Withdrawal type"
              classNames={selectStyles}
              className="w-[190px]"
              data={[
                { value: "all", label: "All" },
                { value: "onchain", label: "On-chain" },
                { value: "internal", label: "Internal" },
              ]}
              value={methodFilter}
              onChange={(value) =>
                setMethodFilter((value as "all" | "onchain" | "internal") ?? "all")
              }
            />
            {filtersActive && (
              <button
                className="pb-2.5 text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
                onClick={() => {
                  setTokenFilter(null);
                  setMethodFilter("all");
                }}
              >
                Reset
              </button>
            )}
          </div>
        </FilterBar>
      )}

      <TableCard
        loading={isPending}
        hasData={rows.length > 0 || hasNextPage}
        emptyTitle={EMPTY_TITLES[tab]}
      >
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh>Time</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Coin</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>From / To</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {rows.map((row: any, idx: number) => (
              <TableTr
                key={row.id ?? idx}
                onClick={() => setSelectedTransaction(row)}
                className="!cursor-pointer"
              >
                <TableTd className="text-white/50">
                  {fmtDateTime(row.createdAt ?? row.completedAt)}
                </TableTd>
                <TableTd>{rowTypeDisplay(row)}</TableTd>
                <TableTd className="!text-white !font-bold">
                  {rowCoinLabel(row)}
                </TableTd>
                <TableTd className="tabular-nums text-white">
                  {fmtNum(row.amount ?? row.quantity)}
                </TableTd>
                <TableTd className="text-white/60">{rowRouteLabel(row)}</TableTd>
                <TableTd>
                  <StatusPill status={row.status} />
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>

      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadedCount={loadedCount}
        isError={isError}
        onRetry={refetch}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  );
};

const FiatDepositTable = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const {
    items,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    loadedCount,
    isError,
    refetch,
    fetchNextPage,
  } = useInfiniteList({
    queryKey: fiatKeys.historyList(),
    limit: LIMIT,
    fetchPage: (params) => fiatService.getHistory(params),
  });

  const rows = useMemo(
    () =>
      items.filter((row: any) =>
        String(row.type ?? "").toLowerCase().includes("deposit")
      ),
    [items]
  );

  return (
    <div className="flex flex-col gap-4">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <TableCard
        loading={isPending}
        hasData={rows.length > 0 || hasNextPage}
        emptyTitle="No fiat deposits yet"
      >
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh>Time</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Fiat Amount</TableTh>
              <TableTh>Received</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {rows.map((row: any, idx: number) => (
              <TableTr
                key={row.id ?? idx}
                onClick={() => setSelectedTransaction(row)}
                className="!cursor-pointer"
              >
                <TableTd className="text-white/50">
                  {fmtDateTime(row.createdAt ?? row.completedAt)}
                </TableTd>
                <TableTd className="font-bold uppercase">
                  {rowTypeLabel(row) || "—"}
                </TableTd>
                <TableTd className="tabular-nums text-white">
                  {fmtNum(row.fiatAmount)}
                  {row.currency ? (
                    <span className="text-white/40"> {String(row.currency).toUpperCase()}</span>
                  ) : null}
                </TableTd>
                <TableTd className="tabular-nums text-white/80">
                  {fmtNum(row.assetAmount)}
                  {row.asset ? (
                    <span className="text-white/40"> {String(row.asset).toUpperCase()}</span>
                  ) : null}
                </TableTd>
                <TableTd>
                  <StatusPill status={row.status} />
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>

      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadedCount={loadedCount}
        isError={isError}
        onRetry={refetch}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  );
};

export const AssetHistory = () => {
  const [activeTab, setActiveTab] = useState<TabId>("transactions");

  return (
    <main className="flex flex-col gap-6 w-full animate-fade-in max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineHistory size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Asset History
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Deposits, withdrawals, transfers, P2P trades and fiat deposits in
            one place
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab((value as TabId) ?? "transactions")}
        classNames={classes}
        keepMounted={false}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTab key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTab>
          ))}
        </TabsList>

        <TabsPanel value="transactions" pt="lg">
          <HistoryTable tab="transactions" />
        </TabsPanel>
        <TabsPanel value="deposit" pt="lg">
          <HistoryTable tab="deposit" />
        </TabsPanel>
        <TabsPanel value="withdraw" pt="lg">
          <HistoryTable tab="withdraw" />
        </TabsPanel>
        <TabsPanel value="transfers" pt="lg">
          <HistoryTable tab="transfers" />
        </TabsPanel>
        <TabsPanel value="p2p" pt="lg">
          <HistoryTable tab="p2p" />
        </TabsPanel>
        <TabsPanel value="fiat-deposit" pt="lg">
          <FiatDepositTable />
        </TabsPanel>
      </Tabs>
    </main>
  );
};
