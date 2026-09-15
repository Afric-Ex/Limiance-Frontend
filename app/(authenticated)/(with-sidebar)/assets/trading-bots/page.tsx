"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTab, TabsPanel, Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { botService, botKeys } from "@/src/services/bot";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { CreateBotModal } from "@/src/components/assets/create-bot-modal";
import clsx from "clsx";
import { MdOutlineAddCircleOutline, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { LuBot } from "react-icons/lu";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { TradingBotsSkeleton } from "@/src/components/skeletons";

type BotType = "spot" | "futures";

function BotCard({ bot, onStop, stopping }: { bot: any; onStop: () => void; stopping: boolean }) {
  const isProfit = bot.pnl >= 0;
  return (
    <div className="bg-[#181a20] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-4 hover:border-white/[0.1] transition-all">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-base text-white">{bot.pair}</span>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded w-fit">{bot.strategy}</span>
        </div>
        <span className={clsx("text-[10px] uppercase font-bold px-2 py-1 rounded-md",
          bot.status === "active" ? "bg-success-6/10 text-success-5" : "bg-white/[0.05] text-white/40"
        )}>
          {bot.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-white/[0.02] rounded-lg p-3 border border-white/[0.02]">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 font-medium">Invested</span>
          <span className="font-mono text-sm font-bold text-white/90">${bot.investmentAmount?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 font-medium">ROI</span>
          <span className={clsx("font-mono text-sm font-bold", isProfit ? "text-success-5" : "text-error-1")}>
            {isProfit ? "+" : ""}{(bot.roi ?? 0).toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 font-medium">PnL</span>
          <span className={clsx("font-mono text-sm font-bold flex items-center gap-1", isProfit ? "text-success-5" : "text-error-1")}>
            {isProfit ? <MdTrendingUp size={12} /> : <MdTrendingDown size={12} />}
            {isProfit ? "+" : ""}{(bot.pnl ?? 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-white/30 font-medium">
          {bot.asset} · Started {new Date(bot.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onStop}
          disabled={stopping}
          className="flex items-center gap-1.5 text-xs font-bold text-error-1 hover:text-white bg-error-1/10 hover:bg-error-1/20 border border-error-1/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {stopping ? <Loader size={10} color="red" /> : null}
          Stop Bot
        </button>
      </div>
    </div>
  );
}

function BotTab({ type }: { type: BotType }) {
  const queryClient = useQueryClient();

  const { data: bots = [], isLoading } = useQuery({
    queryKey: botKeys.activeBots(type),
    queryFn: () => botService.getActiveBots(type),
    select: (res: any) => res?.data ?? [],
  });

  const { mutate: stopBot, isPending: stoppingId, variables: stoppingVar } = useMutation({
    mutationFn: (botId: string) => botService.stopBot(botId),
    onSuccess: () => {
      successNotification("Bot stopped successfully");
      queryClient.invalidateQueries({ queryKey: botKeys.activeBots(type) });
    },
    onError: errorMessageHandler,
  });

  const totalInvested = bots.reduce((s: number, b: any) => s + (b.investmentAmount ?? 0), 0);
  const totalPnl = bots.reduce((s: number, b: any) => s + (b.pnl ?? 0), 0);
  const totalRoi = bots.length > 0 ? bots.reduce((s: number, b: any) => s + (b.roi ?? 0), 0) / bots.length : 0;

  const openCreateModal = () => {
    modals.open({
      title: `Create ${type === "spot" ? "Spot" : "Futures"} Bot`,
      children: <CreateBotModal type={type} />,
      centered: true,
      size: "lg",
      classNames: {
        content: "!bg-[#181a20] !border !border-white/[0.06] !rounded-2xl",
        header: "!bg-transparent !p-6 !pb-4",
        title: "!text-lg !font-bold !text-white",
        close: "!text-white/50 hover:!text-white hover:!bg-white/[0.05]",
        body: "!p-6 !pt-0",
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Active Bots", value: bots.length.toString(), sub: `${type} market` },
          { label: "Total Invested", value: `$${totalInvested.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, sub: "USDT equivalent" },
          { label: "Avg. ROI", value: `${totalRoi >= 0 ? "+" : ""}${totalRoi.toFixed(2)}%`, sub: `Total PnL: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`, positive: totalPnl >= 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#181a20] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-2">
            <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">{stat.label}</span>
            <span className={clsx("text-2xl font-mono font-bold", (stat as any).positive === false ? "text-error-1" : (stat as any).positive === true ? "text-success-5" : "text-white")}>
              {stat.value}
            </span>
            <span className="text-[10px] text-white/30 font-medium">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Bot Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Active Bots</h3>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all active:scale-95 hover:shadow-[0_0_12px_rgba(77,119,240,0.4)]"
          >
            <MdOutlineAddCircleOutline size={16} />
            Create New Bot
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#181a20] border border-white/[0.04] rounded-xl p-5 h-[180px] animate-pulse" />
            ))}
          </div>
        ) : bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
            <LuBot size={40} className="text-white" />
            <p className="text-sm font-medium text-white">No active bots. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot: any) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onStop={() => stopBot(bot.id)}
                stopping={stoppingId && stoppingVar === bot.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TradingBotsInner() {
  return (
    <main className="flex flex-col gap-6 pb-20 w-full">
      {/* Premium Hero Header */}
      <div className="relative rounded-2xl w-full p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-[#181a20] to-[#0d0e12] border border-white/[0.04]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 relative z-10">
          Trading <span className="text-primary">Bots</span>
        </h1>
        <p className="text-sm text-white/50 relative z-10 max-w-lg">
          Automate your trading strategies 24/7. Configure DCA or Grid bots across Spot and Futures markets without lifting a finger.
        </p>
      </div>

      {/* Main Tab Content */}
      <Tabs
        defaultValue="spot"
        classNames={{
          root: "w-full",
          list: "!flex !gap-8 border-b border-white/[0.06] mb-6",
          tab: "!px-0 !py-4 hover:!bg-transparent hover:!border-transparent data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-primary !border-b-[2px] !border-transparent !rounded-none !text-sm !font-bold text-white/50 transition-all",
          panel: "!pt-0",
        }}
      >
        <TabsList>
          <TabsTab value="spot">Spot Bots</TabsTab>
          <TabsTab value="futures">Futures Bots</TabsTab>
        </TabsList>
        <TabsPanel value="spot"><BotTab type="spot" /></TabsPanel>
        <TabsPanel value="futures"><BotTab type="futures" /></TabsPanel>
      </Tabs>
    </main>
  );
}

export default function TradingBots() {
  return (
    <PageSuspense fallback={<TradingBotsSkeleton />}>
      <TradingBotsInner />
    </PageSuspense>
  );
}
