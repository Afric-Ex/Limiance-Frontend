"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { useTranslations } from "next-intl";
import { FiatBuySell } from "@/src/components/orders/fiat-buy-sell";
import { FiatDeposit } from "@/src/components/orders/fiat-deposit";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FiatOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function FiatOrdersInner() {
  const t = useTranslations("Orders");
  return (
    <OrdersPageFrame
      title={t("fiatOrders")}
      description={t("fiatOrdersDescription")}
      actionLabel={t("buyCrypto")}
      actionHref="/transactions/fiat-deposit"
    >
      <Tabs classNames={ordersTabsClassNames} defaultValue="buy">
        <TabsList>
          <TabsTab value="buy">{t("buySell")}</TabsTab>
          <TabsTab value="deposit">{t("depositWithdraw")}</TabsTab>
        </TabsList>

        <TabsPanel value="buy">
          <FiatBuySell />
        </TabsPanel>
        <TabsPanel value="deposit">
          <FiatDeposit />
        </TabsPanel>
      </Tabs>
    </OrdersPageFrame>
  );
}

export default function FiatOrders() {
  return (
    <PageSuspense fallback={<FiatOrdersSkeleton />}>
      <FiatOrdersInner />
    </PageSuspense>
  );
}
