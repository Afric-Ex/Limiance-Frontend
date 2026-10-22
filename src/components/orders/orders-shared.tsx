"use client";

import { EmptyTable } from "../icons/empty-table";
import { Skeleton } from "@/src/components/shared/skeleton";
import { parseDate } from "@/src/lib/parse-date";

export { parseDate };

export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const fmtNum = (value: unknown, fallback = "—", maxDigits = 8) => {
  const n = toNumber(value);
  return n === null ? fallback : n.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
};

export const fmtDate = (value: unknown, fallback = "—") => {
  // Go zero-time ("0001-01-01 ...") means "not set" — treat it as empty.
  const str = String(value ?? "").trim();
  if (!str || str.startsWith("0001-01-01")) return fallback;
  const d = parseDate(value);
  return !d
    ? fallback
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const fmtDateTime = (value: unknown, fallback = "—") => {
  const d = parseDate(value);
  return !d ? fallback : d.toLocaleString();
};

export const getPair = (order: any) =>
  order.pair || (order.base && order.quote ? `${order.base}/${order.quote}` : "—");

export const getAmount = (order: any) => order.amount ?? order.quantity;

export const getTotal = (order: any) => {
  if (order.total !== undefined && order.total !== null) return order.total;
  const price = toNumber(order.price);
  const amount = toNumber(getAmount(order));
  return price !== null && amount !== null ? price * amount : null;
};

export const sideTone = (side?: string) =>
  String(side ?? "").toLowerCase() === "buy" ? "text-[#25AB42]" : "text-[#F6465D]";

type StatusTone = "green" | "red" | "amber" | "blue" | "neutral" | "muted";

const STATUS_TONES: Record<string, StatusTone> = {
  filled: "green",
  fulfilled: "green",
  completed: "green",
  success: "green",
  released: "green",
  paid: "blue",
  processing: "blue",
  open: "blue",
  pending: "amber",
  disputed: "amber",
  cancelled: "red",
  canceled: "red",
  expired: "red",
  failed: "red",
  rejected: "red",
};

const TONE_CLASSES: Record<StatusTone, string> = {
  green: "text-[#25AB42] bg-[#25AB42]/10 border-[#25AB42]/20",
  red: "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20",
  amber: "text-[#FBA42A] bg-[#FBA42A]/10 border-[#FBA42A]/20",
  blue: "text-[#4d77f0] bg-[#4d77f0]/10 border-[#4d77f0]/20",
  neutral: "text-white/70 bg-white/5 border-white/10",
  muted: "text-white/40 bg-white/[0.04] border-white/[0.08]",
};

export const StatusPill = ({
  status,
}: {
  status?: string | null;
}) => {
  if (!status) return null;
  const key = String(status).toLowerCase();
  const tone = STATUS_TONES[key] ?? "neutral";
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wide ${TONE_CLASSES[tone]}`}>
      {status}
    </span>
  );
};

export const tableClassNames = {
  table: "min-w-[880px]",
  th: "!py-3 !px-4 first:!pl-5 !text-[11px] !font-medium !uppercase !tracking-wider !text-white/40 !border-b !border-white/[0.06] !bg-transparent !whitespace-nowrap",
  tr: "!border-b !border-white/[0.06] last:!border-0 hover:!bg-white/[0.02] !transition-colors",
  td: "!py-4 !px-4 first:!pl-5 !text-sm !whitespace-nowrap !text-white/80 !font-medium",
};

export const selectStyles = {
  input: "!h-10 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-[#181a20] !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary",
};

export const dateStyles = {
  input: "!h-10 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  calendarHeader: "!text-white",
  day: "data-[selected]:!bg-primary hover:!bg-white/[0.04]",
};

export const searchInputClass = {
  input: "!h-10 !bg-white/[0.04] hover:!bg-white/[0.06] focus:!bg-white/[0.08] !border !border-white/[0.08] focus:!border-primary/50 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !w-full sm:!w-[240px] !rounded-xl !transition-all placeholder:!text-white/20",
};

export const FilterBar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
    {children}
  </div>
);

const CHIP_STYLE = {
  active: "bg-primary text-white shadow-md cursor-default pointer-events-none",
  idle: "text-white/50 hover:text-white hover:bg-white/[0.04]",
};

export const ChipToggle = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <div className="flex self-end bg-white/[0.04] p-1 rounded-lg border border-white/[0.06]">
    {options.map((item) => (
      <button
        key={item}
        onClick={() => onChange(item)}
        className={`py-1.5 px-4 text-sm font-semibold rounded-md transition-all ${
          value === item ? CHIP_STYLE.active : CHIP_STYLE.idle
        }`}
      >
        {item}
      </button>
    ))}
  </div>
);

export const TableCard = ({
  loading,
  hasData,
  emptyTitle,
  children,
  minHeight = 320,
}: {
  loading: boolean;
  hasData: boolean;
  emptyTitle: string;
  children: React.ReactNode;
  minHeight?: number;
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
        <div className="flex flex-col gap-4 p-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        className="rounded-2xl border border-white/[0.06] bg-[#181a20] flex flex-col items-center justify-center gap-4 opacity-70"
        style={{ minHeight }}
      >
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <EmptyTable />
        </div>
        <span className="text-sm font-semibold text-white/40">{emptyTitle}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">{children}</div>
    </div>
  );
};

export const EmptyState = ({ title }: { title: string }) => (
  <div className="flex h-[320px] flex-col items-center justify-center gap-4 opacity-70">
    <EmptyTable />
    <span className="text-sm font-semibold text-white/40">{title}</span>
  </div>
);