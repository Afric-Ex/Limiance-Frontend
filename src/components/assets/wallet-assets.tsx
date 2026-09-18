"use client";

import React from "react";
import { Table, TableTd, TableTh, TableTr } from "@mantine/core";
import classes from "@/src/styles/assets-overview.module.css";
import { InlineLoading } from "../shared/inline-loading";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export const WalletAssets = () => {
  const { allocations, isAllocationsLoading: isLoading } = usePortfolioWs();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm text-gray-46">Total Value</span>
        <span className="text-base font-bold">
          ₦{allocations?.totalValue
            ? (+allocations.totalValue).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"}
        </span>
      </div>
      <Table
        classNames={{
          th: classes.table_th,
          tr: classes.table_tr,
        }}
      >
        <TableTr>
          <TableTh>Coin</TableTh>
          <TableTh>Balance</TableTh>
          <TableTh>Value (NGN)</TableTh>
          <TableTh>Percentage</TableTh>
        </TableTr>
        {isLoading ? (
          <InlineLoading />
        ) : allocations?.allocations?.length ? (
          allocations.allocations.map((item, index) => (
            <TableTr key={`${item.symbol}-${item.name ?? "asset"}-${index}`}>
              <TableTd>
                <span className="flex flex-col gap-2px">
                  <span className="text-base uppercase font-bold">{item.symbol}</span>
                  <span className="text-8px">{item.name}</span>
                </span>
              </TableTd>
              <TableTd>
                <span className="text-base font-bold">{item.balance}</span>
              </TableTd>
              <TableTd>
                <span className="text-sm font-bold">
                  ₦{(+item.value).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </TableTd>
              <TableTd>
                <span className="text-sm font-bold">{item.percentage}%</span>
              </TableTd>
            </TableTr>
          ))
        ) : (
          <TableTr>
            <TableTd colSpan={4}>
              <span className="flex justify-center py-10 text-sm text-gray-46">
                No allocation data
              </span>
            </TableTd>
          </TableTr>
        )}
      </Table>
    </div>
  );
};
