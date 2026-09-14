"use client";

import { useState } from "react";
import { IoMdCheckmark } from "react-icons/io";
import { IoCopyOutline } from "react-icons/io5";
import { Tooltip } from "@mantine/core";

export const Copy = ({
  text,
  color,
}: {
  text: string | undefined;
  color?: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (isCopied) return;
    await navigator.clipboard.writeText(text ?? "");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Tooltip
      label={isCopied ? "Copied!" : "Copy"}
      withArrow
      color="#181a20"
      classNames={{ tooltip: "!text-xs !font-semibold !border !border-white/[0.08]" }}
    >
      <button
        onClick={handleCopy}
        className={`inline-flex items-center justify-center w-6 h-6 rounded transition-all duration-200 active:scale-90 ${
          isCopied
            ? "text-success-6 bg-success-6/10 scale-110"
            : "text-white/40 hover:text-primary hover:bg-primary/10"
        }`}
        style={!isCopied ? { color: color } : undefined}
      >
        {isCopied ? (
          <IoMdCheckmark size={14} className="animate-[scalePop_0.2s_ease-out]" />
        ) : (
          <IoCopyOutline size={14} />
        )}
      </button>
    </Tooltip>
  );
};
