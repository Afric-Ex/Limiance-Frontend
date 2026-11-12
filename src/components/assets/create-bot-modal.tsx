"use client";

import { useState } from "react";
import { NumberInput, Select, Loader } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { botService, botKeys, BotType } from "@/src/services/bot";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { modals } from "@mantine/modals";
import { useTranslations } from "next-intl";

const PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"];
const STRATEGIES = ["DCA", "Grid", "TWAP"];

export const CreateBotModal = ({ type }: { type: BotType }) => {
  const t = useTranslations("Assets");
  const [pair, setPair] = useState<string | null>("BTC/USDT");
  const [strategy, setStrategy] = useState<string | null>("DCA");
  const [amount, setAmount] = useState<number | string>("");
  const queryClient = useQueryClient();

  const { mutate: createBot, isPending } = useMutation({
    mutationFn: () => botService.createBot({
      type,
      pair: pair ?? "BTC/USDT",
      strategy: strategy ?? "DCA",
      investmentAmount: String(amount),
      asset: "USDT",
    }),
    onSuccess: () => {
      successNotification(t("botCreated", { strategy, pair }));
      queryClient.invalidateQueries({ queryKey: botKeys.activeBots(type) });
      modals.closeAll();
    },
    onError: errorMessageHandler,
  });

  return (
    <div className="flex flex-col gap-6 text-white p-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{t("tradingPair")}</label>
          <Select
            data={PAIRS}
            value={pair}
            onChange={setPair}
            classNames={{ input: "!bg-white/[0.03] !border-white/[0.06] !text-white !rounded-lg focus:!border-primary", dropdown: "!bg-[#1e2026]" }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{t("strategy")}</label>
          <Select
            data={STRATEGIES}
            value={strategy}
            onChange={setStrategy}
            classNames={{ input: "!bg-white/[0.03] !border-white/[0.06] !text-white !rounded-lg focus:!border-primary", dropdown: "!bg-[#1e2026]" }}
          />
        </div>
      </div>

      {strategy === "DCA" && (
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-xs text-white/50 leading-relaxed">
          <span className="font-bold text-primary block mb-1">{t("dcaTitle")}</span>
          {t("dcaDescription")}
        </div>
      )}
      {strategy === "Grid" && (
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-xs text-white/50 leading-relaxed">
          <span className="font-bold text-primary block mb-1">{t("gridTitle")}</span>
          {t("gridDescription")}
        </div>
      )}
      {strategy === "TWAP" && (
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-xs text-white/50 leading-relaxed">
          <span className="font-bold text-primary block mb-1">{t("twapTitle")}</span>
          {t("twapDescription")}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{t("investmentAmount")}</label>
        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] focus-within:border-primary transition-colors rounded-lg px-4 h-[52px]">
          <NumberInput
            hideControls
            value={amount}
            onChange={setAmount}
            min={10}
            classNames={{
              root: "flex-1",
              input: "!bg-transparent !h-full !text-base font-bold font-mono !text-white !border-0 placeholder:!text-white/20",
            }}
            placeholder="100.00"
          />
          <span className="text-sm font-bold text-white/40 ml-2 border-l border-white/[0.06] pl-4">USDT</span>
        </div>
      </div>

      <button
        onClick={() => createBot()}
        disabled={isPending || !pair || !strategy || !amount}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 active:scale-95 hover:shadow-[0_0_15px_rgba(77,119,240,0.3)] mt-2"
      >
        {isPending && <Loader size={16} color="white" />}
        {t("launchBot")}
      </button>
    </div>
  );
};
