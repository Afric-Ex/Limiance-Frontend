import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { SpotRecords } from "@/src/components/orders/spot-records";
import { MarginRecords } from "@/src/components/orders/margin-records";
import { FundingWallet } from "@/src/components/orders/funding-wallet";
import { Crypto } from "@/src/components/orders/crypto";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { TransactionAnalysisSkeleton } from "@/src/components/skeletons/orders";
import { MdOutlineInsights } from "react-icons/md";

function TransactionAnalysisInner() {
  return (
    <main className="flex flex-col gap-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineInsights size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Transaction Analysis
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Records across your spot, margin, crypto and funding wallets
          </p>
        </div>
      </div>

      <Tabs classNames={classes} defaultValue="crypto">
        <TabsList>
          <TabsTab value="crypto">Crypto</TabsTab>
          <TabsTab value="spot">Spot Records</TabsTab>
          <TabsTab value="margin">Margin Records</TabsTab>
          <TabsTab value="funding">Funding Wallet</TabsTab>
        </TabsList>

        <TabsPanel value="crypto">
          <Crypto />
        </TabsPanel>
        <TabsPanel value="spot">
          <SpotRecords />
        </TabsPanel>
        <TabsPanel value="margin">
          <MarginRecords />
        </TabsPanel>
        <TabsPanel value="funding">
          <FundingWallet />
        </TabsPanel>
      </Tabs>
    </main>
  );
}

export default function TransactionAnalysis() {
  return (
    <PageSuspense fallback={<TransactionAnalysisSkeleton />}>
      <TransactionAnalysisInner />
    </PageSuspense>
  );
}
