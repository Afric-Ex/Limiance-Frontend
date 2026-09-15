import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { SpotRecords } from "@/src/components/orders/spot-records";
import { MarginRecords } from "@/src/components/orders/margin-records";
import { FundingWallet } from "@/src/components/orders/funding-wallet";
import { Crypto } from "@/src/components/orders/crypto";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { TransactionAnalysisSkeleton } from "@/src/components/skeletons";

function TransactionAnalysisInner() {
  return (
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
  );
}

export default function TransactionAnalysis() {
  return (
    <PageSuspense fallback={<TransactionAnalysisSkeleton />}>
      <TransactionAnalysisInner />
    </PageSuspense>
  );
}
