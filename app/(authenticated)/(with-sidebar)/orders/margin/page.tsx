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
import { OrdersPageHeader } from "@/src/components/orders/orders-page-header";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

function MarginOrdersInner() {
  return (
    <main className="flex flex-col gap-8 px-5 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6 mt-2">
      <OrdersPageHeader
        icon={<MdOutlineAccountBalanceWallet size={24} />}
        title="Margin Orders"
        description="Margin positions, capital flow, debt and liquidation history"
      />

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
