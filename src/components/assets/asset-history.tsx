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
  ResponsiveFilters,
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
import { useTranslations } from "next-intl";

const LIMIT = 30;

const TABS = [
  { id: "transactions", labelKey: "tabTransactions" },
  { id: "deposit", labelKey: "tabDeposit" },
  { id: "withdraw", labelKey: "tabWithdraw" },
  { id: "transfers", labelKey: "tabTransfers" },
  { id: "p2p", labelKey: "tabP2p" },
  { id: "fiat-deposit", labelKey: "tabFiatDeposit" },
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

const EMPTY_TITLE_KEYS: Record<TabId, string> = {
  transactions: "emptyTransactions",
  deposit: "emptyDeposit",
  withdraw: "emptyWithdraw",
  transfers: "emptyTransfers",
  p2p: "emptyP2p",
  "fiat-deposit": "emptyFiatDeposit",
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  p2p: "typeP2p",
  deposit: "typeDeposit",
  withdrawal: "typeWithdrawal",
  internal: "typeInternalTransfer",
  conversion: "typeConversion",
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

const rowTypeDisplay = (row: Record<string, any>, t: (key: string, values?: any) => string): string => {
  const label = rowTypeLabel(row);
  if (!label) return "—";
  const key = label.toLowerCase();
  const labelKey = TYPE_LABEL_KEYS[key];
  const base = labelKey ? t(labelKey) : label;
  const meta = String(row.metadata ?? "").trim().toLowerCase();
  if (key === "p2p" && (meta === "buy" || meta === "sell")) {
    return t("p2pSide", {
      type: base,
      side: meta === "buy" ? t("buy") : t("sell"),
    });
  }
  return base;
};

const BALANCE_LABEL_KEYS: Record<string, string> = {
  spot_balance: "balanceSpot",
  funding_balance: "balanceFunding",
  locked_balance: "balanceLocked",
};

const partyLabel = (value: unknown, t: (key: string, values?: any) => string): string => {
  const raw = String(value ?? "").trim();
  if (!raw || isZeroAddress(raw)) return "";
  const bucket = BALANCE_LABEL_KEYS[raw.toLowerCase()];
  if (bucket) return t(bucket);
  return raw.length > 20 ? truncateCryptoAddress(raw) : raw;
};

/**
 * Where the money moved: `locked_balance → funding_balance` becomes
 * "Locked → Funding". On-chain legs carry an address in the balance fields,
 * which truncates to the usual short form.
 */
const rowRouteLabel = (row: Record<string, any>, t: (key: string, values?: any) => string): string => {
  const from = partyLabel(row.fromBalance ?? row.from ?? row.fromUserId, t);
  const to = partyLabel(
    row.toBalance ?? row.to ?? row.toUserId ?? row.destinationAddress,
    t
  );
  if (!from && !to) return "—";
  if (!from || !to) return from || to;
  return from === to ? from : `${from} → ${to}`;
};

const HistoryTable = ({ tab }: { tab: WalletFlowTab }) => {
  const t = useTranslations("Assets");
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
          <ResponsiveFilters>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label={t("filterToken")}
              placeholder={t("filterAllTokens")}
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
              label={t("filterWithdrawalType")}
              classNames={selectStyles}
              className="w-[190px]"
              data={[
                { value: "all", label: t("filterAll") },
                { value: "onchain", label: t("filterOnchain") },
                { value: "internal", label: t("filterInternal") },
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
                {t("filterReset")}
              </button>
            )}
          </div>
          </ResponsiveFilters>
        </FilterBar>
      )}

      <TableCard
        loading={isPending}
        hasData={rows.length > 0 || hasNextPage}
        emptyTitle={t(EMPTY_TITLE_KEYS[tab])}
      >
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
                <TableTh>{t("colTime")}</TableTh>
                <TableTh>{t("colType")}</TableTh>
                <TableTh>{t("colCoin")}</TableTh>
                <TableTh>{t("colAmount")}</TableTh>
                <TableTh>{t("colFromTo")}</TableTh>
                <TableTh>{t("colStatus")}</TableTh>
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
                <TableTd>{rowTypeDisplay(row, t)}</TableTd>
                <TableTd className="!text-white !font-bold">
                  {rowCoinLabel(row)}
                </TableTd>
                <TableTd className="tabular-nums text-white">
                  {fmtNum(row.amount ?? row.quantity)}
                </TableTd>
                <TableTd className="text-white/60">{rowRouteLabel(row, t)}</TableTd>
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
  const t = useTranslations("Assets");
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
        emptyTitle={t("emptyFiatDeposit")}
      >
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh>{t("colTime")}</TableTh>
              <TableTh>{t("colType")}</TableTh>
              <TableTh>{t("colFiatAmount")}</TableTh>
              <TableTh>{t("colReceived")}</TableTh>
              <TableTh>{t("colStatus")}</TableTh>
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
  const t = useTranslations("Assets");
  const [activeTab, setActiveTab] = useState<TabId>("transactions");

  return (
    <main className="flex flex-col gap-6 w-full animate-fade-in max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineHistory size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">
            {t("title")}
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("subtitle")}
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
              {t(tab.labelKey)}
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
