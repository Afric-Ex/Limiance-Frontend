import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { ConvertTable } from "@/src/components/orders/convert-history";
import { ConvertOpenOrders } from "@/src/components/orders/convert-open-orders";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { ConvertHistorySkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function ConvertHistoryInner() {
  return (
    <OrdersPageFrame title="Convert history" description="Review completed conversions and in-progress orders.">
      <Tabs classNames={ordersTabsClassNames} defaultValue="history">
        <TabsList>
          <TabsTab value="history">Convert History</TabsTab>
          <TabsTab value="orders">Open Orders</TabsTab>
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
