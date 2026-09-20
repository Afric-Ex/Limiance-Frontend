"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};

export const FiatBuySell = () => {
  const { data: history } = useQuery({
    queryKey: tradingKeys.fiatOrderHistory,
    queryFn: () =>
      tradingService.fiatOrderHistory(),
    select: (res) => res.data,
  });

  const hasHistory = history && history.length > 0;

  return (
    <div className="flex flex-col gap-9">
      <div className="flex items-end gap-3 justify-between">
        <div className="flex gap-3">
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
          <Select
            label="Time"
            data={["Last 7 Days"]}
            defaultValue="Last 7 Days"
            classNames={selectStyles}
          />
          <Select
            label="Currency"
            data={["USD"]}
            defaultValue="USD"
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
      <div className="py-5 min-h-292px rounded-32px bg-gray-7 px-7 pb-9">
        {hasHistory ? (
          <Table classNames={{ th: "!text-gray-9 !text-sm", td: "!text-sm !py-4 !border-white/[8%]" }}>
            <TableThead>
              <TableTr>
                <TableTh>Order ID</TableTh>
                <TableTh>Time</TableTh>
                <TableTh>Category</TableTh>
                <TableTh>Price</TableTh>
                <TableTh>Fiat/Crypto Amount</TableTh>
                <TableTh>Received</TableTh>
                <TableTh>Status</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {history.map((item: any) => (
                <TableTr key={item.id}>
                  <TableTd>{item.id}</TableTd>
                  <TableTd>{new Date(item.createdAt).toLocaleString()}</TableTd>
                  <TableTd className={item.type === "buy" ? "!text-green-400" : "!text-red-400"}>
                    {item.type.toUpperCase()}
                  </TableTd>
                  <TableTd>{parseFloat(item.rate).toLocaleString()} {item.currency}</TableTd>
                  <TableTd>{item.fiatAmount} {item.currency}</TableTd>
                  <TableTd>{item.assetAmount} {item.asset}</TableTd>
                  <TableTd>
                    <span className="text-green-400">{item.status}</span>
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
