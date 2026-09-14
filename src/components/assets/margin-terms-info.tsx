import { Checkbox } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";

export const MarginTermsInfo = () => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="bg-[#181a20] flex flex-col gap-6 rounded-2xl w-full">
      <div className="flex flex-col gap-5">
        <h3 className="font-bold text-xl sm:text-2xl text-white">
          Terms of Use
        </h3>
        
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 sm:p-6 text-white/70 text-sm sm:text-base leading-relaxed overflow-y-auto max-h-[40vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
        <Checkbox
          classNames={{ 
            input: "!bg-white/5 !border-white/20 checked:!bg-primary checked:!border-primary",
            label: "!text-white/60 !text-sm !font-medium"
          }}
          label="I have read and agreed to the terms"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <button
          onClick={() => modals.closeAll()}
          disabled={!checked}
          className="w-full sm:w-auto px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};
