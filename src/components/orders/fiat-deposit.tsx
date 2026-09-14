"use client";

import { Select, Table, TableTh, TableTr, TextInput } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { Search } from "../icons/search";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};

export const FiatDeposit = () => {
  return (
    <div className="flex flex-col gap-9">
      <div className="flex items-end gap-3">
        <div className="flex gap-3">
          <Select
            label="Coin"
            data={["All"]}
            defaultValue="All"
            classNames={selectStyles}
          />
          <Select
            label="Time"
            data={["Last 7 Days"]}
            defaultValue="Last 7 Days"
            classNames={selectStyles}
          />
        </div>
        <div className="flex items-center gap-5">
          <TextInput
            classNames={{
              input: "!h-11 !bg-gray-13 !border-0 !w-[386px] !rounded-full",
            }}
            placeholder="Search order no."
            leftSection={<Search />}
          />
          <span className="text-xs font-medium cursor-pointer">Reset</span>
        </div>
      </div>
      <div className="py-5 h-292px rounded-32px bg-gray-7 px-7 pb-9 ">
        <Table
          classNames={{
            th: "!text-gray-9 !text-sm",
          }}
        >
          <TableTr>
            <TableTh>Order ID</TableTh>
            <TableTh>Time</TableTh>
            <TableTh>Category</TableTh>
            <TableTh>Price</TableTh>
            <TableTh>Fiat/Crypto Amount</TableTh>
            <TableTh>Received</TableTh>
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
    </div>
  );
};
