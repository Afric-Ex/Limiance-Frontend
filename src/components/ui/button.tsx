import React from "react";
import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "outline"
  | "buy"
  | "sell"
  | "ghost";

export type ButtonSize = "primary" | "secondary" | "compact" | "small";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-strong text-white hover:bg-primary-strong/90 shadow-glow/20",
  secondary:
    "bg-muted text-[var(--color-text-primary)] hover:bg-line",
  subtle:
    "bg-surface text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-muted",
  outline:
    "bg-transparent border border-line text-[var(--color-text-primary)] hover:bg-surface",
  buy:
    "bg-buy text-white hover:bg-buy/90 shadow-[0_0_12px_rgba(37,171,66,0.25)]",
  sell:
    "bg-sell text-white hover:bg-sell/90 shadow-[0_0_12px_rgba(246,70,93,0.25)]",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  primary: "h-[var(--size-button-primary)]",
  secondary: "h-[var(--size-button-secondary)]",
  compact: "h-[var(--size-input-compact)] px-4 text-sm",
  small: "h-8 px-3 text-xs",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

export function Button({
  variant = "primary",
  size = "primary",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], size !== "compact" && size !== "small" && "w-full", className)}
      {...rest}
    />
  );
}