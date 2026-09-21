import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { ConvertTable } from "@/src/components/orders/convert-history";
import { ConvertOpenOrders } from "@/src/components/orders/convert-open-orders";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { ConvertHistorySkeleton } from "@/src/components/skeletons/orders";
import { MdOutlineSwapHoriz } from "react-icons/md";

function ConvertHistoryInner() {
  return (
    <main className="flex flex-col gap-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineSwapHoriz size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Convert History
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Past conversions and any in-progress conversion orders
          </p>
        </div>
      </div>

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
