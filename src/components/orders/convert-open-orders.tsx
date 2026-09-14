"use client";

import { Table, TableTh, TableTr } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";

export const ConvertOpenOrders = () => {
  return (
    <div className="py-5 h-292px rounded-32px bg-gray-7 px-7 pb-9 ">
      <Table
        classNames={{
          th: "!text-gray-9 !text-sm",
        }}
      >
        <TableTr>
          <TableTh>Conversion Time</TableTh>
          <TableTh>Wallet</TableTh>
          <TableTh>Trading Pair</TableTh>
          <TableTh>Type</TableTh>
          <TableTh>From</TableTh>
          <TableTh>To</TableTh>
          <TableTh>Price</TableTh>
          <TableTh>Status</TableTh>
        </TableTr>
      </Table>
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <EmptyTable />
          <span className="text-xs font-medium text-gray-9">No Records</span>
        </div>
      </div>
    </div>
  );
};
