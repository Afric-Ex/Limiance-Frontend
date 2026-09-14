"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableTr, TableTh, TableTd, Menu } from "@mantine/core";
import { MdKeyboardArrowDown } from "react-icons/md";
import { tradingService } from "@/src/services/trading";
import { MOCK_MODE } from "@/src/mocks";
import { mockTrading } from "@/src/mocks/mock-trading";
import { InlineLoading } from "../shared/inline-loading";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export const MarginPositions = () => {
  const router = useRouter();
  const { data: positions, isLoading } = useQuery({
    queryKey: ["margin-positions"],
    queryFn: () =>
      MOCK_MODE.marginTrading
        ? mockTrading.marginPositions()
        : tradingService.marginPositions(),
    select: (res) => res.data ?? [],
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
            table: "min-w-[700px]",
            th: "!text-white/40 !uppercase !tracking-wider !text-[10px] !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]",
            td: "!text-sm !py-4 !border-b !border-white/[0.04] !font-medium",
            tr: "hover:!bg-white/[0.02] !transition-colors group",
          }}
        >
          <thead>
            <TableTr>
              <TableTh className="!pl-6">Trading Pair</TableTh>
              <TableTh>Assets</TableTh>
              <TableTh>Size</TableTh>
              <TableTh>Leverage</TableTh>
              <TableTh>Margin Used</TableTh>
              <TableTh className="!pr-6 !text-right">Action</TableTh>
            </TableTr>
          </thead>
          <tbody>
            {!positions?.length ? (
              <TableTr>
                <TableTd colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/25">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="opacity-50"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-sm font-medium">No open margin positions</span>
                  </div>
                </TableTd>
              </TableTr>
            ) : (
              positions.map((pos: any, idx: number) => {
                const pair = pos.pair || `${pos.base}/${pos.quote}`;
                const base = pos.base || pair.split("/")[0];
                const quote = pos.quote || pair.split("/")[1] || "USDT";
                
                return (
                  <TableTr key={pos.id || idx}>
                    <TableTd className="!pl-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            {pair}
                          </span>
                          <span
                            className={clsx(
                              "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                              pos.side === "buy" || pos.side === "BUY"
                                ? "bg-emerald-400/10 text-emerald-400"
                                : "bg-red-400/10 text-red-400"
                            )}
                          >
                            {pos.side}
                          </span>
                        </div>
                        <span className="text-xs text-white/40">
                          ID: {pos.id?.slice(0, 8)}...
                        </span>
                      </div>
                    </TableTd>
                    <TableTd>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-white/80">{base}</span>
                        <span className="text-xs text-white/40">{quote}</span>
                      </div>
                    </TableTd>
                    <TableTd>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-mono font-medium text-white">
                          {Number(pos.quantity || 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-white/40">
                          @ ${Number(pos.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </TableTd>
                    <TableTd>
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                        {pos.leverage || "1"}x
                      </span>
                    </TableTd>
                    <TableTd>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-mono font-medium text-white">
                          {Number(pos.marginUsed || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-white/40">{quote}</span>
                      </div>
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
                            <span className="text-xs font-semibold">Manage</span>
                            <MdKeyboardArrowDown size={14} />
                          </button>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item onClick={() => router.push(`/trades/spot?pair=${pair.replace('/', '_')}`)}>
                            Trade {pair}
                          </Menu.Item>
                          <Menu.Divider className="!border-white/[0.06]" />
                          <Menu.Item className="!text-red-400 hover:!bg-red-400/10 hover:!text-red-400">
                            Close Position
                          </Menu.Item>
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
