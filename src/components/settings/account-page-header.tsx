import { ReactNode } from "react";
import clsx from "clsx";

export function AccountPageHeader({
  title,
  description,
  icon,
  action,
  eyebrow = "Account center",
  compact = true,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <header
      className={clsx(
        "relative isolate overflow-hidden border border-white/[0.08] shadow-[0_18px_48px_rgba(0,0,0,0.2)]",
        compact ? "rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4" : "rounded-3xl p-6 sm:p-7"
      )}
      style={{
        background:
          "radial-gradient(ellipse at 88% 0%, color-mix(in srgb, var(--color-primary) 20%, transparent), transparent 38%), linear-gradient(130deg, var(--color-elevated) 0%, var(--color-surface) 72%)",
      }}
    >
      <div
        className={clsx(
          "relative z-10 flex justify-between",
          compact ? "items-center gap-3" : "flex-wrap items-end gap-5"
        )}
      >
        <div className={clsx("flex min-w-0 items-start", compact ? "gap-3" : "gap-4")}>
          <span
            className={clsx(
              "flex shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/[0.12] text-primary",
              compact ? "h-10 w-10" : "h-12 w-12"
            )}
          >
            {icon}
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={clsx(
                "font-bold uppercase tracking-[0.17em] text-primary",
                compact ? "mb-1 text-[9px]" : "mb-1.5 text-[10px]"
              )}
            >
              {eyebrow}
            </p>
            <h1
              className={clsx(
                "font-bold leading-tight tracking-[-0.035em] text-white",
                compact
                  ? "text-xl sm:text-[22px]"
                  : "text-[26px] max-[640px]:text-[22px]"
              )}
            >
              {title}
            </h1>
            <p
              className={clsx(
                "text-white/55",
                compact
                  ? "mt-1 text-xs leading-5 max-sm:hidden"
                  : "mt-1.5 max-w-2xl text-sm leading-6"
              )}
            >
              {description}
            </p>
          </div>
        </div>
        {action && (
          <div
            className={clsx(
              "shrink-0",
              !compact && "max-[640px]:w-full [&>button]:max-[640px]:w-full"
            )}
          >
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
