"use client";

import React from "react";
import { Modal } from "@mantine/core";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdOutlineClose } from "react-icons/md";
import clsx from "clsx";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

export interface MethodOption {
  icon: React.ReactNode;
  title: string;
  /** Segments split on "|" render as separate description lines. */
  description: string;
  badge?: string;
  badgeClass?: string;
  iconBg?: string;
  ctaColor?: string;
  disabled?: boolean;
  onSelect: () => void;
}

const DEFAULT_BADGE_CLASS = "bg-white/[0.06] text-white/50 border border-white/[0.08]";
const DEFAULT_ICON_BG = "from-primary/20 to-primary/5";
const DEFAULT_CTA_CLASS = "bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)]";
const SUCCESS_CTA_CLASS =
  "bg-success-5 hover:bg-success-6 hover:shadow-[0_0_16px_rgba(14,203,129,0.3)]";
const SUCCESS_ICON_BG = "from-success-5/20 to-success-5/5";

/** Selectable method cards — same language as the "Add Funds" deposit sheet. */
export const MethodOptionList = ({ options }: { options: MethodOption[] }) => {
  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => {
        const segments = option.description
          .split("|")
          .map((segment) => segment.trim())
          .filter(Boolean);

        return (
          <button
            key={option.title}
            type="button"
            disabled={option.disabled}
            onClick={option.onSelect}
            className={clsx(
              "group relative w-full rounded-xl border text-left transition-all duration-300 overflow-hidden",
              option.disabled
                ? "border-white/[0.04] bg-white/[0.02] opacity-60 cursor-not-allowed"
                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] active:scale-[0.99] cursor-pointer"
            )}
          >
            {/* subtle gradient left edge */}
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <span className="flex items-center justify-between px-5 py-5">
              {/* left: icon + text */}
              <span className="flex items-center gap-4 min-w-0">
                <span
                  className={clsx(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                    option.iconBg ?? DEFAULT_ICON_BG
                  )}
                >
                  {option.icon}
                </span>
                <span className="flex flex-col gap-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-base font-semibold text-white">{option.title}</span>
                    {option.badge ? (
                      <span
                        className={clsx(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          option.badgeClass ?? DEFAULT_BADGE_CLASS
                        )}
                      >
                        {option.badge}
                      </span>
                    ) : null}
                  </span>
                  {segments.map((segment) => (
                    <span key={segment} className="text-xs text-white/40 leading-relaxed max-w-[260px]">
                      {segment}
                    </span>
                  ))}
                </span>
              </span>

              {/* right: Go affordance */}
              <span
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold shrink-0 ml-4",
                  option.ctaColor ?? DEFAULT_CTA_CLASS
                )}
              >
                Go
                <FaArrowRightLong size={10} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const SUCCESS_METHOD_STYLES = {
  iconBg: SUCCESS_ICON_BG,
  ctaColor: SUCCESS_CTA_CLASS,
};

interface MethodSheetProps {
  title: string;
  subtitle?: string;
  options: MethodOption[];
  onClose: () => void;
}

/** Self-contained sheet (header + options) for modals.open / Mantine Modal bodies. */
export const MethodSheet = ({ title, subtitle, options, onClose }: MethodSheetProps) => {
  return (
    <div className="w-full max-w-[540px] bg-[#181a20] rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-lg font-bold text-white tracking-tight">{title}</h4>
          {subtitle ? <p className="text-xs text-white/40">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      <div className="flex flex-col p-6">
        <MethodOptionList options={options} />
      </div>
    </div>
  );
};

interface MethodSelectModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: MethodOption[];
}

/** Controlled Mantine modal wrapper around MethodSheet. */
export const MethodSelectModal = ({
  opened,
  onClose,
  title,
  subtitle,
  options,
}: MethodSelectModalProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      size="auto"
      styles={DEFAULT_MODAL_SETTINGS.styles}
    >
      <MethodSheet title={title} subtitle={subtitle} options={options} onClose={onClose} />
    </Modal>
  );
};
