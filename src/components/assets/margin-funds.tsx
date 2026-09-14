import { Table, TableTr, TableTh, TableTd, Menu } from "@mantine/core";
import React from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { assetKeys, asset } from "@/src/services/asset";
import { useQuery } from "@tanstack/react-query";
import { InlineLoading } from "../shared/inline-loading";
import { useRouter } from "next/navigation";

export const MarginFunds = () => {
  const router = useRouter();
  const { data: portfolio, isLoading } = useQuery({
    queryKey: assetKeys.portfolio(),
    queryFn: asset.fetchPortfolio,
    select: ({ data }) => data ?? [],
    staleTime: 30_000,
    throwOnError: false,
    retry: false,
  });

  if (isLoading) return <InlineLoading />;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
      <div className="overflow-x-auto">
        <Table
          classNames={{
            table: "min-w-[640px]",
            th: "!text-white/40 !uppercase !tracking-wider !text-[10px] !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]",
            td: "!text-sm !py-4 !border-b !border-white/[0.04] !font-medium",
            tr: "hover:!bg-white/[0.02] !transition-colors",
          }}
        >
          <thead>
            <TableTr>
              <TableTh className="!pl-6">Coin</TableTh>
              <TableTh>Total Balance</TableTh>
              <TableTh>Available Balance</TableTh>
              <TableTh>Locked</TableTh>
              <TableTh className="!pr-6 !text-right">Action</TableTh>
            </TableTr>
          </thead>
          <tbody>
            {!portfolio?.length ? (
              <TableTr>
                <TableTd colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/25">
                    <span className="text-sm font-medium">No margin assets</span>
                  </div>
                </TableTd>
              </TableTr>
            ) : (
              portfolio.map((item: any) => {
                const balStr = String(item.marginBalance || "0").replace(/,/g, "");
                const balNum = parseFloat(balStr);
                const lockStr = String(item.lockedBalance || "0").replace(/,/g, "");
                const lockNum = parseFloat(lockStr);

                return (
                  <TableTr key={item.symbol}>
                    <TableTd className="!pl-6">
                      <span className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.symbol}
                            className="w-8 h-8 rounded-full shrink-0"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {item.symbol?.[0]}
                          </span>
                        )}
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-white/90 uppercase">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] text-white/40">{item.name}</span>
                        </span>
                      </span>
                    </TableTd>
                    <TableTd>
                      <span className="text-sm font-bold text-white">
                        {balNum.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </span>
                    </TableTd>
                    <TableTd>
                      <span className="text-sm font-medium text-white">
                        {(balNum - lockNum).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </span>
                    </TableTd>
                    <TableTd>
                      <span className="text-sm font-medium text-white/60">
                        {lockNum.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </span>
                    </TableTd>
                    <TableTd className="!pr-6 !text-right">
                      <Menu 
                        position="bottom-end" 
                        withArrow 
                        arrowPosition="center"
                        offset={4}
                        classNames={{
                          dropdown: "!bg-[#181a20] !border !border-white/[0.06] !rounded-xl !p-1 !shadow-xl",
                          item: "!text-sm !font-semibold !text-white/70 hover:!text-white hover:!bg-white/[0.05] !rounded-lg !py-2 !px-4 !transition-colors",
                        }}
                      >
                        <Menu.Target>
                          <button className="inline-flex items-center gap-1 bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-95 border border-white/[0.05]">
                            <span className="text-xs font-semibold">Action</span>
                            <MdKeyboardArrowDown size={14} />
                          </button>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item onClick={() => router.push(`/trades/spot?pair=${item.symbol}_USDT`)}>
                            Trade
                          </Menu.Item>
                          <Menu.Item>Borrow</Menu.Item>
                          <Menu.Item>Repay</Menu.Item>
                          <Menu.Divider className="!border-white/[0.06]" />
                          <Menu.Item>Transfer</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </TableTd>
                  </TableTr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};
