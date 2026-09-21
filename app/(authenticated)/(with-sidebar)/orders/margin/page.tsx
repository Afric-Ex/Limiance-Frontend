import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { MarginOpenOrders } from "@/src/components/orders/margin-open-orders";
import { MarginOrderHistory } from "@/src/components/orders/margin-order-history";
import { MarginOrderDetails } from "@/src/components/orders/margin-order-details";
import { CapitalFlow } from "@/src/components/orders/capital-flow";
import { DebtHistory } from "@/src/components/orders/debt-history";
import { Liquidation } from "@/src/components/orders/liquidation";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { MarginOrdersSkeleton } from "@/src/components/skeletons/orders";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

function MarginOrdersInner() {
  return (
    <main className="flex flex-col gap-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineAccountBalanceWallet size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Margin Orders
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Margin positions, capital flow, debt and liquidation history
          </p>
        </div>
      </div>

      <Tabs classNames={classes} defaultValue="open">
        <TabsList>
          <TabsTab value="open">Open Orders</TabsTab>
          <TabsTab value="history">Order History</TabsTab>
          <TabsTab value="details">Order Details</TabsTab>
          <TabsTab value="capital">Capital Flow</TabsTab>
          <TabsTab value="debt">Debt History</TabsTab>
          <TabsTab value="liquidation">Liquidation</TabsTab>
          <TabsTab value="others">Others</TabsTab>
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
          <CapitalFlow />
        </TabsPanel>
        <TabsPanel value="debt">
          <DebtHistory />
        </TabsPanel>
        <TabsPanel value="liquidation">
          <Liquidation />
        </TabsPanel>
      </Tabs>
    </main>
  );
}

export default function SpotOrders() {
  return (
    <PageSuspense fallback={<MarginOrdersSkeleton />}>
      <MarginOrdersInner />
    </PageSuspense>
  );
}
