"use client";

import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
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
  Skeleton as MantineSkeleton,
} from "@mantine/core";
import { MdOutlineHelp } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import classes from "@/src/styles/assets-margin.module.css";
import { FiatBankDeposit } from "@/src/components/fiat/fiat-bank-deposit";
import { FiatCardDeposit } from "@/src/components/fiat/fiat-card-deposit";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { DepositSkeleton } from "@/src/components/skeletons/orders";
import { useInfiniteList } from "@/src/hooks/use-infinite-list";
import { InfiniteScrollTrigger } from "@/src/components/shared/infinite-scroll-trigger";
import { fiatKeys, fiatService } from "@/src/services/fiat";
import { useSearchParams } from "next/navigation";

const faqs = [
  {
    question: "How long does a bank transfer deposit take to be credited?",
    answer:
      "Once you transfer to your one-time virtual account and confirm the deposit, Monnify verifies that the transfer actually settled before we credit your account. This is usually instant, but can take a few minutes during bank downtime.",
  },
  {
    question: "Can I use the same virtual account number twice?",
    answer:
      "No. Every deposit request creates a fresh one-time NGN virtual account that expires automatically after the displayed duration. Always transfer to the account number shown on screen.",
  },
  {
    question: "What happens if I transfer more or less than the requested amount?",
    answer:
      "Transfers that do not match the expected settlement amount may not be auto-credited. Transfer exactly the total payable amount shown to ensure a smooth deposit.",
  },
  {
    question: "Why do I need to confirm my deposit?",
    answer:
      "The confirm step asks Monnify whether your bank transfer actually settled before we credit your crypto. You should only tap confirm after your bank shows the transfer as successful.",
  },
  {
    question: "Is there a minimum or maximum deposit?",
    answer:
      "Minimum and maximum limits follow your account's deposit rules. The buy page and the quote endpoint enforce the exact window for your account tier.",
  },
];

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

function FiatDepositInner() {
  const limit = 30;
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "card" ? "card" : "bank";

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

  return (
    <div className="flex flex-col gap-10 max-[1150px]:px-2 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6">
      {/* Page header */}
      <div className="flex max-[410px]:flex-col items-center gap-3">
        <h1 className="text-xl max-[1150px]:text-lg font-bold text-white tracking-tight">Fiat Deposit</h1>
        <span className="text-xs max-[1150px]:text-[10px] font-medium text-white/40">
          Fund your account with NGN via bank transfer or card
        </span>
      </div>

      {/* Tabs + FAQ grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-[1150px]:gap-4 items-start max-[1150px]:flex max-[1150px]:flex-col">
        <div className="flex flex-col gap-4 w-full min-w-0">
          <Tabs keepMounted={false} classNames={classes} defaultValue={defaultTab}>
            <TabsList>
              <TabsTab value="bank">Bank Transfer</TabsTab>
              <TabsTab value="card">Card</TabsTab>
            </TabsList>
            <TabsPanel value="bank" pt="lg">
              <FiatBankDeposit />
            </TabsPanel>
            <TabsPanel value="card" pt="lg">
              <FiatCardDeposit />
            </TabsPanel>
          </Tabs>

          <div className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
            <IoMdInformationCircleOutline size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs max-[1150px]:text-[10px] text-white/45 leading-relaxed">
              Fiat deposits are NGN-only and settled via Monnify. Prefer trading with merchants instead?{" "}
              <Link href="/trades/p2p" className="text-primary font-semibold hover:text-primary/70 transition-colors">
                Buy on P2P
              </Link>{" "}
              or{" "}
              <Link href="/transactions/deposit" className="text-primary font-semibold hover:text-primary/70 transition-colors">
                deposit crypto
              </Link>.
            </p>
          </div>
        </div>

        {/* Right: FAQ */}
        <div className="sticky top-6 bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl max-[1150px]:relative max-[1150px]:top-0 flex flex-col gap-5 max-[1150px]:gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
              <MdOutlineHelp size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">Fiat Deposit FAQ</h3>
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
                  {item.question}
                </AccordionControl>
                <AccordionPanel>{item.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <h3 className="text-lg font-bold text-white">Fiat History</h3>
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
                  <TableTh className="pl-6">Date & Time</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>Fiat Amount</TableTh>
                  <TableTh>Received</TableTh>
                  <TableTh className="pr-6">Status</TableTh>
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
                  <TableTr key={item.id}>
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
              <MdOutlineHelp size={32} className="text-white/20" />
              <span className="text-sm font-semibold text-white/30">No fiat transactions yet</span>
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

export default function FiatDeposit() {
  return (
    <PageSuspense fallback={<DepositSkeleton />}>
      <FiatDepositInner />
    </PageSuspense>
  );
}