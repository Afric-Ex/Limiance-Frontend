import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { ConvertTable } from "@/src/components/orders/convert-history";
import { ConvertOpenOrders } from "@/src/components/orders/convert-open-orders";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { ConvertHistorySkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageHeader } from "@/src/components/orders/orders-page-header";
import { MdOutlineSwapHoriz } from "react-icons/md";

function ConvertHistoryInner() {
  return (
    <main className="flex flex-col gap-8 page-enter max-[1150px]:gap-6">
      <OrdersPageHeader
        icon={<MdOutlineSwapHoriz size={24} />}
        title="Convert History"
        description="Past conversions and any in-progress conversion orders"
      />

      <Tabs classNames={classes} defaultValue="history">
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
    </main>
  );
}

export default function ConvertHistory() {
  return (
    <PageSuspense fallback={<ConvertHistorySkeleton />}>
      <ConvertHistoryInner />
    </PageSuspense>
  );
}
