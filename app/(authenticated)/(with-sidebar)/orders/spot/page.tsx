import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { OpenTab } from "@/src/components/orders/history-tab";
import { OrderHistory } from "@/src/components/orders/order-history";
import { OrderDetails } from "@/src/components/orders/order-details";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SpotOrdersSkeleton } from "@/src/components/skeletons";

function SpotOrdersInner() {
  return (
    <Tabs classNames={classes} defaultValue="open">
      <TabsList>
        <TabsTab value="open">Open Orders</TabsTab>
        <TabsTab value="history">Order History</TabsTab>
        <TabsTab value="details">Order Details</TabsTab>
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
  );
}

export default function SpotOrders() {
  return (
    <PageSuspense fallback={<SpotOrdersSkeleton />}>
      <SpotOrdersInner />
    </PageSuspense>
  );
}
