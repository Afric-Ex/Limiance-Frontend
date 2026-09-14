"use client";

import { Select, Table, TableTh, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { EmptyTable } from "../icons/empty-table";
import clsx from "clsx";
import { Search } from "../icons/search";
import { DateInput } from "@mantine/dates";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};
const filters = ["Cross", "Isolated"];

export const MarginOrderDetails = () => {
  const [filter, setFilter] = useState("Cross");

  return (
    <div className="flex flex-col gap-9">
      <div className="flex items-center gap-10">
        <div className="flex bg-black/[42%] border border-gray-9/25 rounded-md gap-1 p-1">
          {filters.map((item) => (
            <span
              key={item}
              onClick={() => setFilter(item)}
              className={clsx(
                filter === item
                  ? "bg-gray-13 rounded-md border-gray-9"
                  : "border-black bg-black",
                "py-2 cursor-pointer text-xs px-4  border "
              )}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <TextInput
            classNames={{
              input: "!h-11 !bg-gray-13 !border-0 !w-[386px] !rounded-full",
            }}
            placeholder="Search"
            leftSection={<Search />}
          />
          <span className="text-xs font-medium cursor-pointer">Reset</span>
        </div>
      </div>
      <div className="flex gap-3">
        <Select
          label="Order"
          data={["Limit/Market"]}
          defaultValue="Limit/Market"
          classNames={selectStyles}
        />
        <DateInput label="Date" classNames={selectStyles} />
        <Select
          label="Trading Pair"
          data={["All"]}
          defaultValue="All"
          classNames={selectStyles}
        />
        <Select
          label="Trade"
          data={["Side"]}
          defaultValue="Side"
          classNames={selectStyles}
        />
        <Select
          label="Time"
          data={["Last 7 Days"]}
          defaultValue="Last 7 Days"
          classNames={selectStyles}
        />
      </div>
      <div className="py-5 h-292px rounded-32px bg-gray-7 px-7 pb-9 ">
        <Table
          classNames={{
            th: "!text-gray-9 !text-sm",
          }}
        >
          <TableTr>
            <TableTh>Date</TableTh>
            <TableTh>Trading Pair</TableTh>
            <TableTh>Type</TableTh>
            <TableTh>Price</TableTh>
            <TableTh>Filled</TableTh>
            <TableTh>Fee</TableTh>
            <TableTh>Role</TableTh>
            <TableTh>Total</TableTh>
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
