"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { useTranslations } from "next-intl";
import { MarginOpenOrders } from "@/src/components/orders/margin-open-orders";
import { MarginOrderHistory } from "@/src/components/orders/margin-order-history";
import { MarginOrderDetails } from "@/src/components/orders/margin-order-details";
import { CapitalFlow } from "@/src/components/orders/capital-flow";
import { DebtHistory } from "@/src/components/orders/debt-history";
import { Liquidation } from "@/src/components/orders/liquidation";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { MarginOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersEmptyState, OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";
import { ScreenShare } from "@/src/components/snapshot/screen-share";

function MarginOrdersInner() {
  const t = useTranslations("Orders");
  return (
    <OrdersPageFrame
      title={t("marginOrders")}
      description={t("marginOrdersDescription")}
      actionLabel={t("tradeMargin")}
      actionHref="/trades/margin"
    >
      <Tabs classNames={ordersTabsClassNames} defaultValue="open">
        <TabsList>
          <TabsTab value="open">{t("openOrders")}</TabsTab>
          <TabsTab value="history">{t("orderHistory")}</TabsTab>
          <TabsTab value="details">{t("details")}</TabsTab>
          <TabsTab value="capital">{t("capitalFlow")}</TabsTab>
          <TabsTab value="debt">{t("debtHistory")}</TabsTab>
          <TabsTab value="liquidation">{t("liquidation")}</TabsTab>
          <TabsTab value="others">{t("others")}</TabsTab>
        </TabsList>

        <TabsPanel value="open">
          <MarginOpenOrders />
        </TabsPanel>
        <TabsPanel value="history">
          <MarginOrderHistory />
        </TabsPanel>
        <TabsPanel value="details">
          <MarginOrderDetails />
        </TabsPanel>
        <TabsPanel value="capital">
          <ScreenShare titleKey="capitalFlow" filenameParts={["capital-flow"]}>
            <CapitalFlow />
          </ScreenShare>
        </TabsPanel>
        <TabsPanel value="debt">
          <ScreenShare titleKey="debtHistory" filenameParts={["debt-history"]}>
            <DebtHistory />
          </ScreenShare>
        </TabsPanel>
        <TabsPanel value="liquidation">
          <ScreenShare titleKey="liquidation" filenameParts={["liquidation"]}>
            <Liquidation />
          </ScreenShare>
        </TabsPanel>
        <TabsPanel value="others">
          <OrdersEmptyState
            title={t("emptyOtherMarginActivity")}
            description={t("emptyOtherMarginActivityDescription")}
          />
        </TabsPanel>
      </Tabs>
    </OrdersPageFrame>
  );
}

export default function SpotOrders() {
  return (
    <PageSuspense fallback={<MarginOrdersSkeleton />}>
      <MarginOrdersInner />
    </PageSuspense>
  );
}
