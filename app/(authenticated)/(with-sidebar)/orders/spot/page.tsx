import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { OpenTab } from "@/src/components/orders/history-tab";
import { OrderHistory } from "@/src/components/orders/order-history";
import { OrderDetails } from "@/src/components/orders/order-details";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SpotOrdersSkeleton } from "@/src/components/skeletons/orders";
import Link from "next/link";
import { FiArrowUpRight, FiClock, FiLayers, FiList, FiZap } from "react-icons/fi";

function SpotOrdersInner() {
  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8 page-enter max-[1150px]:gap-5 max-[1150px]:pb-[90px]">
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface px-6 py-6 max-[640px]:px-4 max-[640px]:py-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-primary/[0.12] blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.10] text-primary">
              <FiLayers size={22} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
                <span>Trading</span>
                <span className="h-1 w-1 rounded-full bg-white/25" />
                <span className="text-white/40">Spot activity</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white max-[640px]:text-xl">Orders &amp; trades</h1>
              <p className="mt-1 text-sm text-white/45">Manage live orders and review your spot-market activity.</p>
            </div>
          </div>
          <Link
            href="/trades/spot"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <FiZap size={15} />
            Trade spot
            <FiArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <Tabs
        classNames={{
          root: "flex flex-col gap-0",
          list: "flex w-full gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-elevated p-1.5",
          tab: "!h-11 !shrink-0 !rounded-lg !border-0 !px-4 !text-sm !font-semibold !text-white/45 transition-colors hover:!bg-white/[0.04] data-[active]:!bg-white/[0.08] data-[active]:!text-white max-[480px]:!px-3 max-[480px]:!text-xs",
          tabLabel: "flex items-center gap-2",
          panel: "pt-5 max-[640px]:pt-4",
        }}
        defaultValue="open"
      >
        <TabsList aria-label="Spot order activity">
          <TabsTab value="open">
            <FiZap aria-hidden="true" size={15} />
            Open orders
          </TabsTab>
          <TabsTab value="history">
            <FiClock aria-hidden="true" size={15} />
            Order history
          </TabsTab>
          <TabsTab value="details">
            <FiList aria-hidden="true" size={15} />
            Trade fills
          </TabsTab>
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
