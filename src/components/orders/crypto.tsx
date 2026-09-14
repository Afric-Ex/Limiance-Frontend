"use client";

import { Select, Table, TableTh, TableTr, TableTd, TableTbody, TextInput, Skeleton } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { asset, assetKeys } from "@/src/services/asset";
import { useState } from "react";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};

export const Crypto = () => {
  const [type, setType] = useState<"Deposit" | "Withdrawal">("Deposit");

  const { data: history, isLoading } = useQuery({
    queryKey: assetKeys.transactionHistory({ transaction_type: type.toLowerCase() }),
    queryFn: () => asset.transactionHistory({ transaction_type: type.toLowerCase() as "deposit" | "withdrawal" }),
    select: (res) => res?.data ?? [],
  });

  return (
    <div className="flex flex-col gap-9">
      <div className="flex gap-3">
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
          label="Type"
          data={["Deposit", "Withdrawal"]}
          value={type}
          onChange={(val) => setType(val as "Deposit" | "Withdrawal")}
          classNames={selectStyles}
        />
        <div className="flex self-end items-center gap-5">
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
      <div className="py-5 h-292px rounded-32px bg-gray-7 px-7 pb-9 ">
        <Table
          classNames={{
            th: "!text-gray-9 !text-sm",
          }}
        >
          <TableTr>
            <TableTh>Time</TableTh>
            <TableTh>Type</TableTh>
            <TableTh>Wallet</TableTh>
            <TableTh>Coin</TableTh>
            <TableTh>Amount</TableTh>
            <TableTh>Destination</TableTh>
            <TableTh>Status</TableTh>
          </TableTr>
          <TableTbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableTr key={i}>
                  <TableTd colSpan={7}><Skeleton height={30} radius="md" /></TableTd>
                </TableTr>
              ))
            ) : history && history.length > 0 ? (
              history.map((tx: any, idx: number) => (
                <TableTr key={tx.id || idx}>
                  <TableTd>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}</TableTd>
                  <TableTd className="capitalize">{tx.type || type}</TableTd>
                  <TableTd>{tx.wallet || '—'}</TableTd>
                  <TableTd className="font-bold">{tx.coin || tx.asset || '—'}</TableTd>
                  <TableTd className="font-mono">{Number(tx.amount || 0).toLocaleString()}</TableTd>
                  <TableTd>{tx.destination || tx.address || '—'}</TableTd>
                  <TableTd className="capitalize">{tx.status || 'Completed'}</TableTd>
                </TableTr>
              ))
            ) : null}
          </TableTbody>
        </Table>
        {!isLoading && (!history || history.length === 0) && (
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
