import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { OpenTab } from "@/src/components/orders/history-tab";
import { OrderHistory } from "@/src/components/orders/order-history";
import { OrderDetails } from "@/src/components/orders/order-details";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SpotOrdersSkeleton } from "@/src/components/skeletons/orders";
import { MdOutlineReceiptLong } from "react-icons/md";

function SpotOrdersInner() {
  return (
    <main className="flex flex-col gap-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineReceiptLong size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Spot Orders
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Open orders, order history and trade fills on the spot market
          </p>
        </div>
      </div>

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
