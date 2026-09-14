import { Select, Table, TableTh, TableTr } from "@mantine/core";
import React from "react";
import { EmptyTable } from "../icons/empty-table";
import { DateInput } from "@mantine/dates";

const selectStyles = {
  input: "!h-11 !rounded-lg !text-white !bg-transparent",
  label: "!text-xs !font-medium",
};

export const OrderDetails = () => {
  return (
    <div className="flex flex-col gap-9">
      <div className="flex gap-3">
        <DateInput label="Date" classNames={selectStyles} />
        <div className="flex items-center">
          <Select
            label="Base"
            data={["All"]}
            defaultValue="All"
            classNames={selectStyles}
          />
          <span className="mt-3"> - </span>
          <Select
            label="Qoute"
            data={["All"]}
            defaultValue="All"
            classNames={selectStyles}
          />
        </div>
        <Select
          label="Time"
          data={["Last 7 Days"]}
          defaultValue="Last 7 Days"
          classNames={selectStyles}
        />
      </div>
      <div className="py-5 h-292px rounded-32px bg-gray-7 pb-9 ">
        <Table
          classNames={{
            th: "!text-gray-9 !text-sm",
          }}
        >
          <TableTr>
            <TableTh>Date</TableTh>
            <TableTh>Trading Pair</TableTh>
            <TableTh>Side</TableTh>
            <TableTh>Price</TableTh>
            <TableTh>Role</TableTh>
            <TableTh>Filled</TableTh>
            <TableTh>Fee</TableTh>
            <TableTh>Total</TableTh>
            <TableTh>Total in USDT</TableTh>
          </TableTr>
        </Table>
        <div className="h-full px-7 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <EmptyTable />
            <span className="text-xs font-medium text-gray-9">No Records</span>
          </div>
        </div>
      </div>
    </div>
  );
};
