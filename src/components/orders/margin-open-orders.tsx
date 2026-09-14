"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput, Skeleton } from "@mantine/core";
import React, { useState } from "react";
import { EmptyTable } from "../icons/empty-table";
import clsx from "clsx";
import { Search } from "../icons/search";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockTrading } from "@/src/mocks/mock-trading";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const selectStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-[#181a20] !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

const filters = ["Cross", "Isolated"];

export const MarginOpenOrders = () => {
  const [filter, setFilter] = useState("Cross");
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: tradingKeys.openOrders(),
    queryFn: () =>
      MOCK_MODE.openOrders
        ? mockTrading.fetchOpenOrders()
        : tradingService.fetchOpenOrders(),
    select: (res) => res.data,
  });

  const { mutate: cancelOrder } = useMutation({
    mutationFn: (orderId: string): Promise<any> =>
      MOCK_MODE.openOrders
        ? mockTrading.cancelSpotOrder(orderId)
        : tradingService.closeSpotOrder(orderId),
    onSuccess: () => {
      successNotification("Order cancelled");
      queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders() });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end p-4 rounded-2xl bg-[#181a20] border border-white/[0.06] gap-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Order Type"
            data={["Limit", "Market", "Stop Loss", "Take Profit"]}
            defaultValue="Limit"
            classNames={selectStyles}
            className="w-[140px]"
          />
          <Select
            label="Base Asset"
            data={["All", "BTC", "ETH"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
          <span className="text-white/40 mb-1 font-bold">-</span>
          <Select
            label="Quote Asset"
            data={["All", "USDT", "USDC"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
          <Select
            label="Trade Side"
            data={["All", "Buy", "Sell"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <TextInput
              classNames={{
                input: "!h-11 !bg-white/[0.04] hover:!bg-white/[0.06] focus:!bg-white/[0.08] !border !border-white/[0.08] focus:!border-primary/50 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !w-full sm:!w-[280px] !rounded-xl !transition-all placeholder:!text-white/20",
              }}
              placeholder="Search pair..."
              leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            />
            <button className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2">Reset</button>
          </div>
          
          <div className="flex self-end bg-white/[0.04] p-1 rounded-lg border border-white/[0.06]">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={clsx(
                  "py-1.5 px-5 text-sm font-semibold rounded-md transition-all",
                  filter === item
                    ? "bg-primary text-white shadow-md cursor-default pointer-events-none"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="min-h-[400px] rounded-2xl bg-[#181a20] border border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={50} radius="md" className="!bg-white/[0.02] before:!bg-white/[0.02]" />
            ))}
          </div>
        ) : hasOrders ? (
          <div className="overflow-x-auto custom-scrollbar">
            <Table classNames={{ 
              table: "min-w-[900px]",
              th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]", 
              td: "!text-sm !py-4 !border-b !border-white/[0.04] !text-white/80 !font-medium",
              tr: "hover:!bg-white/[0.02] !transition-colors"
            }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">Pair</TableTh>
                  <TableTh>Side</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Filled</TableTh>
                  <TableTh>Total</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Time</TableTh>
                  <TableTh className="pr-6 text-right">Action</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {orders.map((order: any) => (
                  <TableTr key={order.id}>
                    <TableTd className="pl-6 !text-white !font-bold">{order.pair}</TableTd>
                    <TableTd className={order.side === "buy" ? "!text-success-6" : "!text-error-1"}>
                      {order.side.toUpperCase()}
                    </TableTd>
                    <TableTd>{order.type}</TableTd>
                    <TableTd>{order.price.toLocaleString()}</TableTd>
                    <TableTd>{order.amount}</TableTd>
                    <TableTd>{order.filled}</TableTd>
                    <TableTd>{order.total.toLocaleString()}</TableTd>
                    <TableTd>
                      <span className="text-warning-1 bg-warning-1/10 px-2 py-1 flex items-center justify-center w-fit text-xs font-bold rounded-md uppercase tracking-wider">
                        {order.status || "OPEN"}
                      </span>
                    </TableTd>
                    <TableTd className="text-white/50">{new Date(order.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</TableTd>
                    <TableTd className="pr-6 text-right">
                      <button
                        className="text-error-1 hover:text-error-1/80 bg-error-1/10 hover:bg-error-1/20 transition-all font-semibold text-xs px-3 py-1.5 rounded-lg active:scale-95"
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel
                      </button>
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center flex-col gap-4 opacity-70">
            <EmptyTable />
            <span className="text-sm font-semibold text-white/40">No open orders right now.</span>
          </div>
        )}
      </div>
    </div>
  );
};
