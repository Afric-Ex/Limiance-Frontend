import { Checkbox } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { tradingService } from "@/src/services/trading";
import { errorMessageHandler, type ErrorType } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { portfolioStore } from "@/src/lib/portfolio-store";

export const MarginTermsInfo = () => {
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
      successNotification("Margin account created successfully");
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
          Terms of Use
        </h3>
        
        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-white/70 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent sm:p-5 sm:text-base">
          <p className="mb-4">
            Margin trading involves significant risk. By using margin services,
            you acknowledge the following:
          </p>
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">Market Volatility:</strong> Prices can change quickly, leading to
                unexpected gains or losses.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">Leverage:</strong> Using leverage can amplify both profits and losses,
                meaning you could lose more than your initial investment.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">Forked Coins:</strong> You won&apos;t receive any forked coins from
                blockchain assets in your margin account, even if you&apos;re not
                actively borrowing.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>
                <strong className="text-white">Loan Risks:</strong> If the value of your assets drops below a certain
                level, you&apos;re responsible for covering the losses, which may
                result in forced liquidation.
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
          label="I have read and agreed to the terms"
          checked={checked}
          disabled={createMarginAccount.isPending}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <button
          onClick={() => createMarginAccount.mutate()}
          disabled={!checked || createMarginAccount.isPending}
          className="w-full rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100 sm:w-auto"
        >
          {createMarginAccount.isPending ? "Creating..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};
