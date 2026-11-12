"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Button,
  LoadingOverlay,
  NumberInput,
  Select,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Skeleton as MantineSkeleton,
  TextInput,
} from "@mantine/core";
import { MdOutlineHelp, MdOutlineSendToMobile } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { useFiatWithdrawal } from "@/src/hooks/use-fiat-withdrawal";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { WithdrawalSkeleton } from "@/src/components/skeletons/orders";
import { useInfiniteList } from "@/src/hooks/use-infinite-list";
import { InfiniteScrollTrigger } from "@/src/components/shared/infinite-scroll-trigger";
import { fiatKeys, fiatService } from "@/src/services/fiat";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";

const faqs = [
  {
    question: "fiatFaqQ1",
    answer: "fiatFaqA1",
  },
  {
    question: "fiatFaqQ2",
    answer: "fiatFaqA2",
  },
  {
    question: "fiatFaqQ3",
    answer: "fiatFaqA3",
  },
  {
    question: "fiatFaqQ4",
    answer: "fiatFaqA4",
  },
];

const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";

const bankSelectClass = {
  input: `${inputClass} !text-white`,
  dropdown: "!bg-[#181a20] !border !border-white/[0.08]",
  option: "!text-white hover:!bg-white/[0.04]",
  label: "!mt-0",
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    completed: "text-success-6 bg-success-6/10",
    pending: "text-warning-1 bg-warning-1/10",
    failed: "text-error-1 bg-error-1/10",
  };
  const key = status?.toLowerCase();
  return (
    <span className={`px-2 py-1 w-fit text-xs font-bold rounded-md uppercase tracking-wider ${styles[key] ?? "text-white/50 bg-white/[0.04]"}`}>
      {status}
    </span>
  );
};

function FiatWithdrawInner() {
  const t = useTranslations("Withdrawal");
  const tt = useTranslations("Transactions");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const {
    banks,
    banksLoading,
    form,
    handleWithdrawal,
    withdrawalPending,
    emailVerificationLoading,
  } = useFiatWithdrawal();

  const { coins: portfolio, isLoading: portfolioLoading } = usePortfolioWs({ coins: true });
  const limit = 30;

  const coinPortfolio = form.values.symbol
    ? portfolio?.find((p: any) => p.symbol?.toUpperCase() === form.values.symbol.toUpperCase())
    : undefined;
  const assetBalance = parseFloat(coinPortfolio?.fundingBalance ?? coinPortfolio?.spotBalance ?? "0");

  const {
    items: history,
    isPending: historyLoading,
    isFetchingNextPage,
    hasNextPage,
    loadedCount,
    isError: historyError,
    refetch: refetchHistory,
    fetchNextPage,
  } = useInfiniteList({
    queryKey: fiatKeys.historyList(),
    limit,
    fetchPage: (params) => fiatService.getHistory(params),
  });

  const amountValid = Number(form.values.amount) > 0 && Number(form.values.amount) <= assetBalance;
  const accountValid =
    form.values.bankCode &&
    form.values.accountNumber.replace(/\D/g, "").length >= 10 &&
    form.values.accountName.trim().length > 0;

  return (
    <div className="flex flex-col gap-10 relative max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      <LoadingOverlay visible={withdrawalPending} />

      {/* Page header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-tight">{t("fiatWithdraw")}</h1>
        <span className="text-xs font-medium text-white/40">
          {t("fiatWithdrawSubtitle")}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-[1150px]:gap-4 items-start max-[1150px]:flex max-[1150px]:flex-col">
        {/* Left: Form */}
        <div className="flex flex-col gap-4 w-full min-w-0">
          <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-white">{t("withdrawalDetails")}</h3>
              <p className="text-xs text-white/40">
                {t("fiatWithdrawDescription")}
              </p>
            </div>

            {/* Asset */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t("asset")}</label>
              <Select
                data={["USDT", "USDC", "BTC", "ETH", "SOL"]}
                classNames={bankSelectClass}
                {...form.getInputProps("symbol")}
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t("amount")}</label>
                <span className="text-xs font-medium text-white/40">
                  {t("available")}:{" "}
                  <span className="text-primary font-bold">
                    {portfolioLoading ? "..." : assetBalance.toFixed(8)}{" "}
                    <span className="text-white/40">{form.values.symbol}</span>
                  </span>
                </span>
              </div>
              <NumberInput
                thousandSeparator=","
                hideControls
                classNames={{ input: inputClass, section: "!w-fit !right-3" }}
                placeholder="0.00"
                min={0}
                rightSection={
                  <span className="flex items-center gap-2 pr-1">
                    <span className="text-xs font-bold text-white">{form.values.symbol}</span>
                    <button
                      onClick={() => form.setFieldValue("amount", String(assetBalance))}
                      className="px-2 py-1 bg-primary/15 hover:bg-primary/30 rounded-md text-xs text-primary font-bold transition-colors"
                    >
                      {t("max")}
                    </button>
                  </span>
                }
                error={
                  Number(form.values.amount) > assetBalance
                    ? t("amountExceedsBalance")
                    : null
                }
                {...form.getInputProps("amount")}
              />
            </div>

            {/* Bank */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t("bank")}</label>
              <Select
                data={banks?.map((b) => ({ value: b.code, label: b.name })) ?? []}
                placeholder={banksLoading ? t("loadingBanks") : t("selectBank")}
                searchable
                nothingFoundMessage={t("noBanksFound")}
                classNames={bankSelectClass}
                {...form.getInputProps("bankCode")}
              />
            </div>

            {/* Account Number */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t("accountNumber")}</label>
              <TextInput
                placeholder="0123456789"
                inputMode="numeric"
                maxLength={10}
                classNames={{ input: inputClass, section: "!w-fit !right-3" }}
                error={
                  form.values.accountNumber && form.values.accountNumber.replace(/\D/g, "").length < 10
                    ? t("accountNumberError")
                    : null
                }
                {...form.getInputProps("accountNumber")}
              />
            </div>

            {/* Account Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t("accountName")}</label>
              <TextInput
                placeholder={t("accountNamePlaceholder")}
                classNames={{ input: inputClass }}
                {...form.getInputProps("accountName")}
              />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-0 bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/50">{t("amountReceivedNgn")}</span>
                <span className="text-sm font-bold text-primary">
                  {Number(form.values.amount) > 0
                    ? `${Number(form.values.amount).toLocaleString()} ${form.values.symbol} → NGN`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                <span className="text-sm text-white/50">{t("rate")}</span>
                <span className="text-sm font-medium text-white/70">{t("settledAtCurrentRate")}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-white/50">{t("channel")}</span>
                <span className="text-sm font-semibold text-white/80">{t("monnifyPayout")}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-warning-1/20 bg-warning-1/[0.06] p-3">
              <IoMdInformationCircleOutline size={16} className="text-warning-1 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-warning-1/80 leading-relaxed">
                {t("bankWarning")}
              </span>
            </div>

            <Button
              onClick={handleWithdrawal}
              loading={emailVerificationLoading}
              disabled={!amountValid || !accountValid}
              className="!h-[56px] !rounded-xl !bg-primary hover:!bg-primary/90 !text-white !font-bold !transition-all active:!scale-[0.98] disabled:!opacity-40"
              leftSection={<MdOutlineSendToMobile size={18} />}
            >
              {t("confirmWithdrawal")}
            </Button>
            <p className="text-xs text-white/30 text-center -mt-2">
              {t("requiresKycNote")}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
            <IoMdInformationCircleOutline size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-white/45 leading-relaxed">
              {t("payMerchantNote")}{" "}
              <Link href="/trades/p2p" className="text-primary font-semibold hover:text-primary/70 transition-colors">
                {t("sellOnP2P")}
              </Link>{" "}
              {t("or")}{" "}
              <Link href="/transactions/withdrawal" className="text-primary font-semibold hover:text-primary/70 transition-colors">
                {t("withdrawCryptoToExternalWallet")}
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Right: FAQ */}
        <div className="sticky top-6 bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl max-[1150px]:relative max-[1150px]:top-0 flex flex-col gap-5 max-[1150px]:gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
              <MdOutlineHelp size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">{t("fiatFaqTitle")}</h3>
          </div>
          <Accordion
            classNames={{
              label: "!font-semibold !text-sm !text-white",
              chevron: "!text-primary !w-5 !h-5",
              panel: "!text-sm !text-white/50 !leading-relaxed",
              item: "data-[active]:!bg-primary/[0.04] !border !border-white/[0.06] data-[active]:!border-primary/20 !rounded-xl !mb-2",
              control: "hover:!bg-white/[0.02] !rounded-xl !transition-all",
              root: "!flex !flex-col !gap-2",
            }}
          >
            {faqs.map((item, idx) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionControl
                  icon={
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  }
                >
                  {t(item.question)}
                </AccordionControl>
                <AccordionPanel>{t(item.answer)}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <h3 className="text-lg font-bold text-white">{t("fiatHistoryTitle")}</h3>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl max-[1150px]:rounded-xl overflow-hidden min-h-[200px]">
          <div className="overflow-x-auto">
            <Table classNames={{
              table: "min-w-[760px]",
              th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]",
              td: "!text-sm !py-4 !border-b !border-white/[0.04] !text-white/80 !font-medium",
              tr: "hover:!bg-white/[0.02] !transition-colors",
            }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">{tt("tableDateTime")}</TableTh>
                  <TableTh>{tt("tableType")}</TableTh>
                  <TableTh>{tt("tableFiatAmount")}</TableTh>
                  <TableTh>{tt("tableReceived")}</TableTh>
                  <TableTh className="pr-6">{tt("tableStatus")}</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {historyLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableTr key={`sk-${i}`}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableTd key={j} className={j === 0 ? "pl-6" : j === 4 ? "pr-6" : ""}>
                          <MantineSkeleton height={16} radius="sm" className="!bg-white/[0.04]" width="60%" />
                        </TableTd>
                      ))}
                    </TableTr>
                  ))}

                {history?.map((item: any) => (
                  <TableTr
                    key={item.id}
                    onClick={() => setSelectedTransaction(item)}
                    className="cursor-pointer"
                  >
                    <TableTd className="pl-6 !text-white/40">
                      {new Date(item.createdAt).toLocaleString()}
                    </TableTd>
                    <TableTd className="font-bold uppercase">{item.type ?? "—"}</TableTd>
                    <TableTd className="!text-white !font-bold tabular-nums">
                      {item.fiatAmount ? `${Number(item.fiatAmount).toLocaleString()} ${item.currency ?? ""}`.trim() : "—"}
                    </TableTd>
                    <TableTd className="tabular-nums">
                      {item.assetAmount ? `${Number(item.assetAmount).toLocaleString()} ${item.asset ?? ""}`.trim() : "—"}
                    </TableTd>
                    <TableTd className="pr-6">
                      <StatusBadge status={item.status} />
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </div>

          {!history?.length && !historyLoading && (
            <div className="h-40 flex items-center justify-center flex-col gap-3 opacity-60">
              <MdOutlineSendToMobile size={32} className="text-white/20" />
              <span className="text-sm font-semibold text-white/30">{t("noFiatTransactions")}</span>
            </div>
          )}
        </div>

        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          loadedCount={loadedCount}
          isError={historyError}
          onRetry={refetchHistory}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  );
}

export default function FiatWithdrawal() {
  return (
    <PageSuspense fallback={<WithdrawalSkeleton />}>
      <FiatWithdrawInner />
    </PageSuspense>
  );
}