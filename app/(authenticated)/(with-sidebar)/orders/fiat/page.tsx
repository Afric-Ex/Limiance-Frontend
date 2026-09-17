import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { FiatBuySell } from "@/src/components/orders/fiat-buy-sell";
import { FiatDeposit } from "@/src/components/orders/fiat-deposit";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FiatOrdersSkeleton } from "@/src/components/skeletons/orders";

function FiatOrdersInner() {
  return (
    <Tabs classNames={classes} defaultValue="buy">
      <TabsList>
        <TabsTab value="buy">Buy (Sell)</TabsTab>
        <TabsTab value="deposit">Deposit (Withdraw)</TabsTab>
      </TabsList>

      <TabsPanel value="buy">
        <FiatBuySell />
      </TabsPanel>
      <TabsPanel value="deposit">
        <FiatDeposit />
      </TabsPanel>
    </Tabs>
  );
}

export default function FiatOrders() {
  return (
    <PageSuspense fallback={<FiatOrdersSkeleton />}>
      <FiatOrdersInner />
    </PageSuspense>
  );
}
