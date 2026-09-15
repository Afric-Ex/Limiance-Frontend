import React from "react";
import clsx from "clsx";

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  size?: "standard" | "compact";
  rightIcon?: React.ReactNode;
}

export function FormInput({
  label,
  size = "standard",
  rightIcon,
  className,
  id,
  ...rest
}: FormInputProps) {
  const inputId = id || (label ? `input-${String(label).replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[var(--text-subtitle)] text-[var(--color-text-primary)] font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={clsx(
            "w-full bg-surface border border-line rounded-[var(--radius-md)] px-5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
            size === "standard" ? "h-[var(--size-input-standard)]" : "h-[var(--size-input-compact)] text-sm",
            rightIcon ? "pr-12" : "",
            className
          )}
          {...rest}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[var(--color-text-secondary)]">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
}