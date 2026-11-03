import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { OpenTab } from "@/src/components/orders/history-tab";
import { OrderHistory } from "@/src/components/orders/order-history";
import { OrderDetails } from "@/src/components/orders/order-details";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SpotOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageHeader } from "@/src/components/orders/orders-page-header";
import { MdOutlineReceiptLong } from "react-icons/md";

function SpotOrdersInner() {
  return (
    <main className="flex flex-col gap-8 px-5 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6 mt-2">
      <OrdersPageHeader
        icon={<MdOutlineReceiptLong size={24} />}
        title="Spot Orders"
        description="Open orders, order history and trade fills on the spot market"
      />

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
    </main>
  );
}

export default function SpotOrders() {
  return (
    <PageSuspense fallback={<SpotOrdersSkeleton />}>
      <SpotOrdersInner />
    </PageSuspense>
  );
}
