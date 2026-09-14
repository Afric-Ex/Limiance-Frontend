"use client";

import { Select, Table, TableTh, TableTr, TableTd, TableTbody, Skeleton } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { DateInput } from "@mantine/dates";
import { useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { tradingService, tradingKeys } from "@/src/services/trading";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};

const filters = ["Cross", "Isolated"];

export const MarginRecords = () => {
  const [filter, setFilter] = useState("Cross");

  const { data: records, isLoading } = useQuery({
    queryKey: ['margin-order-history'],
    queryFn: () => tradingService.marginOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col gap-3">
        <div className="flex w-fit bg-black/[42%] border border-gray-9/25 rounded-md gap-1 p-1">
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
        <div className="flex gap-3">
          <DateInput label="Date" classNames={selectStyles} />
          <Select
            label="Time"
            data={["Last 7 Days"]}
            defaultValue="Last 7 Days"
            classNames={selectStyles}
          />
          <Select
            label="Coin"
            data={["All"]}
            defaultValue="All"
            classNames={selectStyles}
          />
          <Select
            label="Category"
            data={["All"]}
            defaultValue="All"
            classNames={selectStyles}
          />
        </div>
      </div>
      <div className="py-5 h-292px rounded-32px bg-gray-7 px-7 pb-9 ">
        <Table
          classNames={{
            th: "!text-gray-9 !text-sm",
          }}
        >
          <TableTr>
            <TableTh className="pl-6">Pair</TableTh>
            <TableTh>Side</TableTh>
            <TableTh>Time</TableTh>
            <TableTh>Price</TableTh>
            <TableTh>Quantity</TableTh>
            <TableTh>Status</TableTh>
          </TableTr>
          <TableTbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableTr key={i}>
                  <TableTd colSpan={6}><Skeleton height={30} radius="md" className="!bg-white/[0.02]" /></TableTd>
                </TableTr>
              ))
            ) : records && records.length > 0 ? (
              records.map((rec: any, idx: number) => {
                const isBuy = rec.side?.toLowerCase() === 'buy';
                return (
                  <TableTr key={rec.id || idx}>
                    <TableTd className="pl-6 font-bold text-white">{rec.pair || `${rec.base || ''}/${rec.quote || ''}`}</TableTd>
                    <TableTd>
                      <span className={isBuy ? "text-emerald-400" : "text-red-400"}>{rec.side}</span>
                    </TableTd>
                    <TableTd>{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : '—'}</TableTd>
                    <TableTd className="font-mono">{Number(rec.price || 0).toLocaleString()}</TableTd>
                    <TableTd className="font-mono">{Number(rec.quantity || rec.amount || 0).toLocaleString()}</TableTd>
                    <TableTd className="capitalize">{rec.status || 'Closed'}</TableTd>
                  </TableTr>
                );
              })
            ) : null}
          </TableTbody>
        </Table>
        {!isLoading && (!records || records.length === 0) && (
          <div className="h-full flex items-center justify-center pt-8">
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
