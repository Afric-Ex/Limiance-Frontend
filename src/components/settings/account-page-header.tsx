import { ReactNode } from "react";

export function AccountPageHeader({
  title,
  description,
  icon,
  action,
  eyebrow = "Account center",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_88%_0%,rgba(77,119,240,0.2),transparent_38%),linear-gradient(130deg,#1b1e27_0%,#13151b_72%)] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:p-7">
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/[0.12] text-[#9bb4ff]">
            {icon}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#91aaff]">
              {eyebrow}
            </p>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.035em] text-white max-[640px]:text-[22px]">
              {title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/55">
              {description}
            </p>
          </div>
        </div>
        {action && (
          <div className="shrink-0 max-[640px]:w-full [&>button]:max-[640px]:w-full">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
