"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { useTranslations } from "next-intl";
import { SpotRecords } from "@/src/components/orders/spot-records";
import { MarginRecords } from "@/src/components/orders/margin-records";
import { FundingWallet } from "@/src/components/orders/funding-wallet";
import { Crypto } from "@/src/components/orders/crypto";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { TransactionAnalysisSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function TransactionAnalysisInner() {
  const t = useTranslations("Orders");
  return (
    <OrdersPageFrame title={t("transactionAnalysis")} description={t("transactionAnalysisDescription")}>
      <Tabs classNames={ordersTabsClassNames} defaultValue="crypto">
        <TabsList>
          <TabsTab value="crypto">{t("crypto")}</TabsTab>
          <TabsTab value="spot">{t("spotRecords")}</TabsTab>
          <TabsTab value="margin">{t("marginRecords")}</TabsTab>
          <TabsTab value="funding">{t("fundingWallet")}</TabsTab>
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
    </OrdersPageFrame>
  );
}

export default function TransactionAnalysis() {
  return (
    <PageSuspense fallback={<TransactionAnalysisSkeleton />}>
      <TransactionAnalysisInner />
    </PageSuspense>
  );
}
