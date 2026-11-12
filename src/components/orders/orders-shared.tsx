"use client";

import { EmptyTable } from "../icons/empty-table";
import { Skeleton } from "@/src/components/shared/skeleton";
import { parseDate } from "@/src/lib/parse-date";
import Link from "next/link";
import { FiActivity, FiArrowUpRight } from "react-icons/fi";
import { useTranslations } from "next-intl";
export { ResponsiveFilters } from "../shared/responsive-filters";

export { parseDate };

export const OrdersPageFrame = ({
  title,
  description,
  actionLabel,
  actionHref = "/trades/spot",
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string | null;
  actionHref?: string;
  children: React.ReactNode;
}) => {
  const t = useTranslations("Orders");
  const resolvedActionLabel = actionLabel === undefined ? t("tradeSpot") : actionLabel;

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 pb-8 page-enter max-[1150px]:gap-4 max-[1150px]:pb-[90px]">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5 max-[640px]:pb-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("accountActivity")}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-white max-[640px]:text-[22px]">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{description}</p>
        </div>
        {resolvedActionLabel && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-primary"
          >
            {resolvedActionLabel}
            <FiArrowUpRight aria-hidden="true" size={15} />
          </Link>
        )}
      </header>
      {children}
    </main>
  );
};

export const ordersTabsClassNames = {
  root: "flex flex-col gap-3",
  list: "!flex !w-full !min-w-0 !flex-nowrap !items-stretch gap-1 overflow-x-auto !rounded-xl !border !border-white/[0.08] !bg-[#181a20] !p-1 scrollbar-none",
  tab: "!h-10 !shrink-0 !rounded-lg !border-0 !px-4 !text-xs !font-semibold !text-white/45 transition-colors hover:!bg-white/[0.04] hover:!text-white/75 data-[active]:!bg-white/[0.08] data-[active]:!text-white sm:!px-5 sm:!text-sm",
  tabLabel: "!whitespace-nowrap",
  panel: "!overflow-hidden !rounded-xl !border !border-white/[0.08] !bg-[#181a20]",
};

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
    <span className={`inline-flex text-micro font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wide ${TONE_CLASSES[tone]}`}>
      {status}
    </span>
  );
};

export const tableClassNames = {
  table: "min-w-[880px]",
  th: "!py-3.5 !px-5 !text-micro !font-semibold !uppercase !tracking-wider !text-white/40 !border-b !border-white/[0.08] !bg-transparent !whitespace-nowrap",
  tr: "!border-b !border-white/[0.04] last:!border-0 hover:!bg-white/[0.03] !transition-colors",
  td: "!py-4 !px-5 !text-sm !whitespace-nowrap !text-white/80 !font-medium",
};

export const selectStyles = {
  input: "!h-10 !rounded-lg !border !border-white/[0.09] hover:!border-white/[0.16] focus:!border-primary/50 !text-white !bg-elevated !text-sm !font-medium !transition-colors",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-elevated !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary",
};

export const dateStyles = {
  input: "!h-10 !rounded-lg !border !border-white/[0.09] hover:!border-white/[0.16] focus:!border-primary/50 !text-white !bg-elevated !text-sm !font-medium !transition-colors",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  calendarHeader: "!text-white",
  day: "data-[selected]:!bg-primary hover:!bg-white/[0.04]",
};

export const searchInputClass = {
  input: "!h-10 !bg-white/[0.035] hover:!bg-white/[0.05] focus:!bg-white/[0.05] !border !border-white/[0.08] focus:!border-primary/50 !w-full sm:!w-[240px] !rounded-lg !transition-colors placeholder:!text-white/30",
};

export const FilterBar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col justify-between gap-3 border-y border-white/[0.08] px-5 py-3 sm:flex-row sm:items-center">
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
  labels,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  labels?: Record<string, string>;
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
        {labels?.[item] ?? item}
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
      <div className="overflow-hidden">
        <div className="flex flex-col gap-3 py-5">
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
        className="flex flex-col items-center justify-center gap-3 py-12 text-center"
        style={{ minHeight }}
      >
        <FiActivity aria-hidden="true" size={24} className="text-primary/75" strokeWidth={1.5} />
        <span className="text-sm font-medium text-white/60">{emptyTitle}</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">{children}</div>
    </div>
  );
};

export const OrdersEmptyState = ({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-12 text-center">
    <FiActivity aria-hidden="true" size={27} className="mb-5 text-primary/80" strokeWidth={1.5} />
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">{description}</p>
    {actionLabel && actionHref && (
      <Link
        href={actionHref}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary-strong px-4 text-xs font-semibold text-white transition-colors hover:bg-primary"
      >
        {actionLabel}
        <FiArrowUpRight aria-hidden="true" size={14} />
      </Link>
    )}
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-lg px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.08]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const EmptyState = ({ title }: { title: string }) => (
  <div className="flex h-[320px] flex-col items-center justify-center gap-4 opacity-70">
    <EmptyTable />
    <span className="text-sm font-semibold text-white/40">{title}</span>
  </div>
);