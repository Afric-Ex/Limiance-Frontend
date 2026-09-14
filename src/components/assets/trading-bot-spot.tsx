import { TextInput, Select, Table, TableTr, TableTh, TableTd, Skeleton } from "@mantine/core";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Approximate } from "../icons/approximate";
import { EmptyTable } from "../icons/empty-table";
import { Search } from "../icons/search";
import { botService, botKeys } from "@/src/services/bot";
import { errorMessageHandler } from "@/src/lib/error-handler";
import classes from "@/src/styles/assets-overview.module.css";

export const TradingBotSpot = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: botsRes, isLoading: botsLoading } = useQuery({
    queryKey: botKeys.activeBots("spot"),
    queryFn: () => botService.getActiveBots("spot"),
    select: (res: any) => res?.data ?? [],
  });

  useQuery({
    queryKey: botKeys.tradingHistory("spot"),
    queryFn: () => botService.tradingHistory({ type: "spot", limit: 50 }),
  });

  const { mutate: stopBot } = useMutation({
    mutationFn: (botId: string) => botService.stopBot(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: botKeys.activeBots("spot") });
      queryClient.invalidateQueries({ queryKey: botKeys.tradingHistory("spot") });
    },
    onError: (e) => errorMessageHandler(e),
  });

  const bots = (botsRes ?? []).filter((b: any) =>
    !search || b.pair?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = bots.reduce((sum: number, b: any) => sum + (b.investmentAmount ?? 0), 0);
  const totalPnl = bots.reduce((sum: number, b: any) => sum + (b.pnl ?? 0), 0);

  return (
    <div className="py-5 min-h-292px border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9">
      <div className="flex flex-col h-full gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-medium">Spot bot account assets</span>
            <div className="flex flex-col gap-2">
              {botsLoading ? (
                <Skeleton height={24} width={120} />
              ) : (
                <>
                  <span className="sm:text-xl text-base font-semibold">
                    {bots.length} Active Bot{bots.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Approximate color="white" />
                    <span className="text-xs font-medium">
                      ${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })} invested
                      {totalPnl !== 0 && (
                        <span className={totalPnl >= 0 ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                          ({totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} PnL)
                        </span>
                      )}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TextInput
              classNames={{ input: "!h-10 !bg-gray-13 !border-0 !rounded-full" }}
              rightSection={<Search />}
              placeholder="Search pair"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <Select
              classNames={{ input: "!w-108px !h-35px !bg-transparent !border-white/55 !rounded-lg" }}
              data={["1-7 Days"]}
              defaultValue="1-7 Days"
            />
            <Select
              classNames={{ input: "!w-108px !h-35px !bg-transparent !border-white/55 !rounded-lg" }}
              data={["ROI"]}
              defaultValue="ROI"
            />
            <Select
              classNames={{ input: "!w-115px !h-35px !bg-transparent !border-white/55 !rounded-lg" }}
              data={["Total PNL"]}
              defaultValue="Total PNL"
            />
          </div>
        </div>
        <div className="w-full overflow-auto">
          <Table classNames={{ th: "!text-gray-9 !text-sm", tr: classes.table_tr }}>
            <TableTr>
              <TableTh>Pair</TableTh>
              <TableTh>Strategy</TableTh>
              <TableTh>Invested</TableTh>
              <TableTh>ROI</TableTh>
              <TableTh>PnL</TableTh>
              <TableTh>Status</TableTh>
              <TableTh>Action</TableTh>
            </TableTr>
            {botsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableTr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableTd key={j}><Skeleton height={16} /></TableTd>
                  ))}
                </TableTr>
              ))
            ) : (
              bots.map((bot: any) => (
                <TableTr key={bot.id}>
                  <TableTd className="font-medium">{bot.pair}</TableTd>
                  <TableTd>{bot.strategy}</TableTd>
                  <TableTd>${(bot.investmentAmount ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</TableTd>
                  <TableTd className={bot.roi >= 0 ? "text-green-400" : "text-red-400"}>
                    {bot.roi >= 0 ? "+" : ""}{(bot.roi ?? 0).toFixed(2)}%
                  </TableTd>
                  <TableTd className={bot.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                    {bot.pnl >= 0 ? "+" : ""}{(bot.pnl ?? 0).toFixed(2)}
                  </TableTd>
                  <TableTd>
                    <span className={`text-xs px-2 py-1 rounded-full ${bot.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {bot.status}
                    </span>
                  </TableTd>
                  <TableTd>
                    <button
                      onClick={() => stopBot(bot.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Stop
                    </button>
                  </TableTd>
                </TableTr>
              ))
            )}
          </Table>
        </div>
        {!botsLoading && bots.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <EmptyTable />
              <span className="text-xs font-medium text-gray-9">No active bots</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
