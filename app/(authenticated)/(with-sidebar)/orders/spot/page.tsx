"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { useTranslations } from "next-intl";
import { OpenTab } from "@/src/components/orders/history-tab";
import { OrderHistory } from "@/src/components/orders/order-history";
import { OrderDetails } from "@/src/components/orders/order-details";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SpotOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function SpotOrdersInner() {
  const t = useTranslations("Orders");
  return (
    <OrdersPageFrame title={t("ordersAndTrades")} description={t("spotActivityDescription")}>
      <Tabs classNames={ordersTabsClassNames} defaultValue="open">
        <TabsList aria-label={t("spotOrderActivity")}>
          <TabsTab value="open" aria-label={t("openOrders")}>{t("openOrders")}</TabsTab>
          <TabsTab value="history" aria-label={t("orderHistory")}>{t("orderHistory")}</TabsTab>
          <TabsTab value="details" aria-label={t("tradeFills")}>{t("tradeFills")}</TabsTab>
        </TabsList>

        <TabsPanel value="open">
          <OpenTab />
        </TabsPanel>
        <TabsPanel value="history">
          <OrderHistory />
        </TabsPanel>
        <TabsPanel value="details">
          <OrderDetails />
        </TabsPanel>
      </Tabs>
    </OrdersPageFrame>
  );
}

export default function SpotOrders() {
  return (
    <PageSuspense fallback={<SpotOrdersSkeleton />}>
      <SpotOrdersInner />
    </PageSuspense>
  );
}
