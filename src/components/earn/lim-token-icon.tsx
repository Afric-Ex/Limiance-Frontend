"use client";

import { useState } from "react";
import clsx from "clsx";
import { LIM_NAME, LIM_SYMBOL } from "@/src/lib/lim";

/**
 * LIM token icon. Uses the backend-provided token logo when available (from
 * `listed_tokens` or the portfolio payload) and falls back to a locally
 * rendered monogram — never a placeholder URL that would render broken.
 */
export function LimTokenIcon({
  logo,
  size = 40,
  className,
}: {
  logo?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!logo && !failed;

  return (
    <span
      className={clsx(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        !showImage && "bg-gradient-to-br from-primary via-primary/80 to-blue-600",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          width={size}
          height={size}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-extrabold text-white leading-none"
          style={{ fontSize: Math.max(11, size * 0.38) }}
        >
          {LIM_SYMBOL.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

export function limTokenAriaLabel(): string {
  return `${LIM_NAME} (${LIM_SYMBOL})`;
}
