"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { useTranslations } from "next-intl";
import { ConvertTable } from "@/src/components/orders/convert-history";
import { ConvertOpenOrders } from "@/src/components/orders/convert-open-orders";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { ConvertHistorySkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function ConvertHistoryInner() {
  const t = useTranslations("Orders");
  return (
    <OrdersPageFrame title={t("convertHistory")} description={t("convertHistoryDescription")}>
      <Tabs classNames={ordersTabsClassNames} defaultValue="history">
        <TabsList>
          <TabsTab value="history">{t("convertHistory")}</TabsTab>
          <TabsTab value="orders">{t("openOrders")}</TabsTab>
        </TabsList>

        <TabsPanel value="history">
          <ConvertTable />
        </TabsPanel>
        <TabsPanel value="orders">
          <ConvertOpenOrders />
        </TabsPanel>
      </Tabs>
    </OrdersPageFrame>
  );
}

export default function ConvertHistory() {
  return (
    <PageSuspense fallback={<ConvertHistorySkeleton />}>
      <ConvertHistoryInner />
    </PageSuspense>
  );
}
