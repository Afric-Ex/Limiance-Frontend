"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { EmptyTable } from "../icons/empty-table";
import clsx from "clsx";
import { Search } from "../icons/search";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockTrading } from "@/src/mocks/mock-trading";
import { tradingKeys, tradingService } from "@/src/services/trading";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};
const filters = ["Cross", "Isolated"];

export const MarginOrderHistory = () => {
  const [filter, setFilter] = useState("Cross");

  const { data: history } = useQuery({
    queryKey: tradingKeys.marginOrderHistory,
    queryFn: () =>
      MOCK_MODE.marginOrderHistory
        ? mockTrading.marginOrderHistory()
        : tradingService.marginOrderHistory(),
    select: (res) => res.data,
  });

  const hasHistory = history && history.length > 0;

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
          label="Sort By"
          data={["Order Time"]}
          defaultValue="Order Time"
          classNames={selectStyles}
        />
      </div>
      <div className="py-5 min-h-292px rounded-32px bg-gray-7 px-7 pb-9">
        {hasHistory ? (
          <Table classNames={{ th: "!text-gray-9 !text-sm", td: "!text-sm !py-4 !border-white/[8%]" }}>
            <TableThead>
              <TableTr>
                <TableTh>Order Time</TableTh>
                <TableTh>Trading Pair</TableTh>
                <TableTh>Type</TableTh>
                <TableTh>Side</TableTh>
                <TableTh>Average</TableTh>
                <TableTh>Price</TableTh>
                <TableTh>Executed</TableTh>
                <TableTh>Amount</TableTh>
                <TableTh>Triggers Condition</TableTh>
                <TableTh>Status</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {history.map((order: any) => (
                <TableTr key={order.id}>
                  <TableTd>{new Date(order.createdAt).toLocaleString()}</TableTd>
                  <TableTd>{order.pair ?? `${order.base}/${order.quote}`}</TableTd>
                  <TableTd>{order.type}</TableTd>
                  <TableTd className={order.side === "buy" ? "!text-green-400" : "!text-red-400"}>
                    {order.side.toUpperCase()}
                  </TableTd>
                  <TableTd>{order.price?.toLocaleString() ?? "—"}</TableTd>
                  <TableTd>{order.price?.toLocaleString() ?? "—"}</TableTd>
                  <TableTd>{order.filled ?? 0}</TableTd>
                  <TableTd>{order.amount ?? order.quantity}</TableTd>
                  <TableTd>—</TableTd>
                  <TableTd>
                    <span className={
                      order.status === "filled" ? "text-green-400" :
                      order.status === "cancelled" ? "text-red-400" :
                      "text-yellow-400"
                    }>
                      {order.status}
                    </span>
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        ) : (
          <div className="h-full flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-4">
              <EmptyTable />
              <span className="text-xs font-medium text-gray-9">No Records</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
