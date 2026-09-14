"use client";

import { EmptyTable } from "@/src/components/icons/empty-table";
import { Search } from "@/src/components/icons/search";
import {
  Select,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  TextInput,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockTrading } from "@/src/mocks/mock-trading";
import { tradingKeys, tradingService } from "@/src/services/trading";

const selectStyles = {
  input: "!h-11 !rounded-lg !bg-transparent",
  label: "!text-xs !font-medium",
};

export default function PaymentHistory() {
  const { data: history } = useQuery({
    queryKey: tradingKeys.paymentHistory,
    queryFn: () =>
      MOCK_MODE.paymentHistory
        ? mockTrading.paymentHistory()
        : tradingService.paymentHistory(),
    select: (res) => res.data,
  });

  const hasHistory = history && history.length > 0;

  return (
    <div className="flex flex-col gap-9">
      <h2 className="text-base font-semibold">Payment History</h2>
      <div className="flex items-end gap-3">
        <div className="flex gap-3">
          <Select
            label="Type"
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
      <div className="py-5 min-h-292px rounded-32px bg-gray-7 px-7 pb-9">
        {hasHistory ? (
          <Table
            classNames={{
              th: "!text-gray-9 !text-sm",
              td: "!text-sm !py-4 !border-white/[8%]",
            }}
          >
            <TableThead>
              <TableTr>
                <TableTh>Date</TableTh>
                <TableTh>Time</TableTh>
                <TableTh>To/From</TableTh>
                <TableTh>Amount</TableTh>
                <TableTh>Currency</TableTh>
                <TableTh>Status</TableTh>
                <TableTh>Action</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {history.map((item: any) => {
                const date = new Date(item.createdAt);
                return (
                  <TableTr key={item.id}>
                    <TableTd>{date.toLocaleDateString()}</TableTd>
                    <TableTd>{date.toLocaleTimeString()}</TableTd>
                    <TableTd>{item.method}</TableTd>
                    <TableTd>{parseFloat(item.amount).toLocaleString()}</TableTd>
                    <TableTd>{item.currency}</TableTd>
                    <TableTd>
                      <span className="text-green-400">{item.status}</span>
                    </TableTd>
                    <TableTd>
                      <span className="text-primary cursor-pointer">Details</span>
                    </TableTd>
                  </TableTr>
                );
              })}
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
}
