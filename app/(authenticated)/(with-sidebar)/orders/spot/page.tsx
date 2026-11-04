import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { OpenTab } from "@/src/components/orders/history-tab";
import { OrderHistory } from "@/src/components/orders/order-history";
import { OrderDetails } from "@/src/components/orders/order-details";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SpotOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function SpotOrdersInner() {
  return (
    <OrdersPageFrame title="Orders & trades" description="Your spot activity, all in one place.">
      <Tabs classNames={ordersTabsClassNames} defaultValue="open">
        <TabsList aria-label="Spot order activity">
          <TabsTab value="open" aria-label="Open orders">Open orders</TabsTab>
          <TabsTab value="history" aria-label="Order history">Order history</TabsTab>
          <TabsTab value="details" aria-label="Trade fills">Trade fills</TabsTab>
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
