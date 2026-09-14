"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr } from "@mantine/core";
import React from "react";
import { EmptyTable } from "../icons/empty-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockTrading } from "@/src/mocks/mock-trading";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};

const toNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatNumber = (value: unknown, fallback = "—") => {
  const numberValue = toNumber(value);
  return numberValue === null ? fallback : numberValue.toLocaleString();
};

const formatDate = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const getPair = (order: any) =>
  order.pair || (order.base && order.quote ? `${order.base}/${order.quote}` : "—");

const getAmount = (order: any) => order.amount ?? order.quantity;

const getTotal = (order: any) => {
  if (order.total !== undefined && order.total !== null) return order.total;
  const price = toNumber(order.price);
  const amount = toNumber(getAmount(order));
  return price !== null && amount !== null ? price * amount : null;
};

export const OpenTab = () => {
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
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
    <div className="flex flex-col gap-9">
      <div className="flex gap-3">
        <Select
          label="Order"
          data={["All"]}
          defaultValue="All"
          classNames={selectStyles}
        />
        <Select
          label="Base"
          data={["All"]}
          defaultValue="All"
          classNames={selectStyles}
        />
        <Select
          label="Qoute"
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
      </div>
      <div className="py-5 min-h-292px rounded-32px bg-gray-7 px-7 pb-9">
        {hasOrders ? (
          <Table classNames={{ th: "!text-gray-9 !text-sm", td: "!text-sm !py-4 !border-white/[8%]" }}>
            <TableThead>
              <TableTr>
                <TableTh>Pair</TableTh>
                <TableTh>Side</TableTh>
                <TableTh>Type</TableTh>
                <TableTh>Price</TableTh>
                <TableTh>Amount</TableTh>
                <TableTh>Filled</TableTh>
                <TableTh>Total</TableTh>
                <TableTh>Status</TableTh>
                <TableTh>Time</TableTh>
                <TableTh>Action</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {orders.map((order: any) => (
                <TableTr key={order.id}>
                  <TableTd>{getPair(order)}</TableTd>
                  <TableTd className={order.side === "buy" ? "!text-green-400" : "!text-red-400"}>
                    {order.side?.toUpperCase() ?? "—"}
                  </TableTd>
                  <TableTd>{order.type ?? "—"}</TableTd>
                  <TableTd>{formatNumber(order.price)}</TableTd>
                  <TableTd>{formatNumber(getAmount(order))}</TableTd>
                  <TableTd>{formatNumber(order.filled ?? order.filledQuantity ?? 0)}</TableTd>
                  <TableTd>{formatNumber(getTotal(order))}</TableTd>
                  <TableTd>{order.status ?? "—"}</TableTd>
                  <TableTd>{formatDate(order.createdAt)}</TableTd>
                  <TableTd>
                    <span
                      className="text-red-400 cursor-pointer text-xs"
                      onClick={() => cancelOrder(order.id)}
                    >
                      Cancel
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
