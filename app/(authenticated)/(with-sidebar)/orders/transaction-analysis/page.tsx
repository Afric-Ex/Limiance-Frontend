import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { SpotRecords } from "@/src/components/orders/spot-records";
import { MarginRecords } from "@/src/components/orders/margin-records";
import { FundingWallet } from "@/src/components/orders/funding-wallet";
import { Crypto } from "@/src/components/orders/crypto";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { TransactionAnalysisSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageHeader } from "@/src/components/orders/orders-page-header";
import { MdOutlineInsights } from "react-icons/md";

function TransactionAnalysisInner() {
  return (
    <main className="flex flex-col gap-8 page-enter max-[1150px]:gap-6">
      <OrdersPageHeader
        icon={<MdOutlineInsights size={24} />}
        title="Transaction Analysis"
        description="Records across your spot, margin, crypto and funding wallets"
      />

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
