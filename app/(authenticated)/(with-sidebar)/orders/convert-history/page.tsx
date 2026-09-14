import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { ConvertTable } from "@/src/components/orders/convert-history";
import { ConvertOpenOrders } from "@/src/components/orders/convert-open-orders";

export default function ConvertHistory() {
  return (
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
  );
}
