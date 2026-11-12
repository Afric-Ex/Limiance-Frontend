"use client";

import { Checkbox, Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "@/src/hooks/use-pathname";
import { tradingService } from "@/src/services/trading";
import { errorMessageHandler, type ErrorType } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { portfolioStore } from "@/src/lib/portfolio-store";
import { useTranslations } from "next-intl";

export const MarginTermsInfo = () => {
  const t = useTranslations("Assets");
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();
  const initialPathname = useRef(pathname);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pathname !== initialPathname.current) {
      modals.closeAll();
    }
  }, [pathname]);

  const createMarginAccount = useMutation({
    mutationFn: tradingService.createMarginAccount,
    onSuccess: async () => {
      successNotification(t("marginAccountCreated"));
      await queryClient.invalidateQueries({ queryKey: ["margin-account"] });
      portfolioStore.refresh();
      modals.closeAll();
    },
    onError: (error) => errorMessageHandler(error as ErrorType),
  });

  return (
    <div className="flex w-full flex-col gap-5 rounded-xl bg-[#181a20]">
      <div className="flex flex-col gap-5">
        <h3 className="font-bold text-xl text-white sm:text-2xl">
          {t("termsOfUse")}
        </h3>

        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-white/70 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent sm:p-5 sm:text-base">
          <p className="mb-4">
            {t("marginTermsIntro")}
          </p>
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">{t("termVolatilityTitle")}</strong>{" "}
                {t("termVolatilityBody")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">{t("termLeverageTitle")}</strong>{" "}
                {t("termLeverageBody")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">{t("termForkedCoinsTitle")}</strong>{" "}
                {t("termForkedCoinsBody")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">{t("termLoanRisksTitle")}</strong>{" "}
                {t("termLoanRisksBody")}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center">
        <Checkbox
          classNames={{ 
            input: "!bg-white/5 !border-white/20 checked:!bg-primary checked:!border-primary",
            label: "!text-white/60 !text-sm !font-medium"
          }}
          label={t("agreeTerms")}
          checked={checked}
          disabled={createMarginAccount.isPending}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <button
          onClick={() => createMarginAccount.mutate()}
          disabled={!checked || createMarginAccount.isPending}
          className="w-full rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100 sm:w-auto flex items-center justify-center gap-2"
        >
          {createMarginAccount.isPending && <Loader size={14} color="white" />}
          {createMarginAccount.isPending ? t("creating") : t("confirm")}
        </button>
      </div>
    </div>
  );
};
