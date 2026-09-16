"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IoClose } from "react-icons/io5";

export const AiBot = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed right-5 bottom-24 sm:right-6 z-[90] w-[300px] max-w-[calc(100vw-2.5rem)] bg-elevated border border-white/10 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.7)] overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Image
                src="/aibot.svg"
                alt="Limiance AI"
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Limiance AI</span>
                <span className="flex items-center gap-1.5 text-10px text-success-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-6" />
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-white/50 hover:text-white transition-colors"
            >
              <IoClose size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="max-w-[85%] bg-primary/10 border border-primary/20 text-sm text-white/90 rounded-xl rounded-tl-sm px-3 py-2">
              Hi there! I&apos;m your Limiance assistant. How can I help you
              get started today?
            </div>
            <div className="flex flex-col gap-2 mt-1">
              <Link
                href="/support"
                className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
              >
                Visit Support Center
              </Link>
              <Link
                href="/auth/signup"
                className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
              >
                Create an Account
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed right-5 bottom-6 sm:right-6 z-[90] rounded-full shadow-[0_8px_32px_rgba(77,119,240,0.45)] hover:scale-105 active:scale-95 transition-transform animate-float"
      >
        <Image
          src="/aibot.svg"
          alt="Limiance AI assistant"
          width={64}
          height={64}
          className="w-14 h-14 sm:w-16 sm:h-16 select-none pointer-events-none"
        />
      </button>
    </>
  );
};