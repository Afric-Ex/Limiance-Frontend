"use client";

import { modals } from "@mantine/modals";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { MdClose, MdOutlineCheckCircleOutline, MdWarning } from "react-icons/md";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

export type TradeConfirmationRow = {
  label: string;
  value: string;
  tone?: "buy" | "sell" | "default";
};

export type TradeConfirmationOptions = {
  title: string;
  description?: string;
  rows: TradeConfirmationRow[];
  warning?: string;
  confirmLabel?: string;
  side?: "buy" | "sell" | "default";
  onConfirm: () => void;
};

type Props = TradeConfirmationOptions & { onCancel: () => void };

const toneClass = (tone?: TradeConfirmationRow["tone"]) =>
  tone === "buy" ? "text-buy" : tone === "sell" ? "text-sell" : "text-white";

const TradeOrderConfirmationModal = ({
  title,
  description,
  rows,
  warning,
  confirmLabel,
  side = "default",
  onCancel,
  onConfirm,
}: Props) => {
  const t = useTranslations("Trading");
  const accent =
    side === "buy"
      ? "bg-buy/10 border-buy/20 text-buy"
      : side === "sell"
        ? "bg-sell/10 border-sell/20 text-sell"
        : "bg-primary/10 border-primary/20 text-primary";

  const confirmClass =
    side === "buy"
      ? "bg-buy hover:bg-buy/90"
      : side === "sell"
        ? "bg-sell hover:bg-sell/90"
        : "bg-primary-strong hover:bg-primary";

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-white/[0.08] bg-[#13151c] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", accent)}>
            <MdOutlineCheckCircleOutline size={22} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-base font-bold text-white">{title}</h4>
            {description && (
              <p className="text-xs text-white/50">{description}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("cancel")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          <MdClose size={18} />
        </button>
      </div>

      <div className="mt-4 h-px bg-white/[0.06]" />

      <div className="mt-4 flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-1 text-sm">
            <span className="text-white/45">{row.label}</span>
            <span className={clsx("text-right font-mono font-semibold tabular-nums", toneClass(row.tone))}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {warning && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5">
          <MdWarning className="mt-0.5 shrink-0 text-amber-300" size={15} />
          <p className="text-xs leading-relaxed text-amber-100/80">{warning}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.05] text-sm font-semibold text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={clsx(
            "h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]",
            confirmClass
          )}
        >
          {confirmLabel ?? t("confirm")}
        </button>
      </div>
    </div>
  );
};

/** Opens the trade confirmation dialog and runs `onConfirm` only after the user accepts. */
export function openTradeOrderConfirmation(options: TradeConfirmationOptions) {
  const id = modals.open({
    ...DEFAULT_MODAL_SETTINGS,
    centered: true,
    size: 440,
    withCloseButton: false,
    children: (
      <TradeOrderConfirmationModal
        {...options}
        onCancel={() => modals.close(id)}
        onConfirm={() => {
          modals.close(id);
          options.onConfirm();
        }}
      />
    ),
  });
}
