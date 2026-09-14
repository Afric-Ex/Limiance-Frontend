import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { MarginOpenOrders } from "@/src/components/orders/margin-open-orders";
import { MarginOrderHistory } from "@/src/components/orders/margin-order-history";
import { MarginOrderDetails } from "@/src/components/orders/margin-order-details";
import { CapitalFlow } from "@/src/components/orders/capital-flow";
import { DebtHistory } from "@/src/components/orders/debt-history";
import { Liquidation } from "@/src/components/orders/liquidation";

export default function SpotOrders() {
  return (
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
  );
}
