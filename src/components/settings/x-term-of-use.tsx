"use client";

import { Checkbox } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";
import { FaXTwitter } from "react-icons/fa6";
import { MdArrowOutward, MdClose, MdOutlineSecurity } from "react-icons/md";

export const XTermOfUse = () => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex max-h-[min(82vh,760px)] flex-col overflow-hidden text-white">
      <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white">
            <FaXTwitter size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Social connection
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Terms of use</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => modals.closeAll()}
          aria-label="Close terms of use"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <MdClose size={19} />
        </button>
      </header>

      <div className="my-5 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.06] p-4">
        <MdOutlineSecurity className="mt-0.5 shrink-0 text-primary" size={18} />
        <p className="text-xs leading-5 text-white/60">
          Review the access requested below before connecting your X account. You can delink the accounts at any time.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/[0.07] bg-black/15 p-4 sm:p-5">
        <p className="text-sm leading-6 text-white/70">
          After selecting the link option, you will be redirected to X to authorize connecting your account to your Limiance UID. If you authorize the connection, Limiance may access:
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {[
            ["Profile information", "Basic information from your X profile."],
            ["Timeline posts", "Tweets from your timeline, including protected Tweets when permitted by X."],
            ["Lists and preferences", "Lists and preferences such as accounts you follow, mute, or block."],
          ].map(([title, detail]) => (
            <li key={title} className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                <span className="block text-sm font-semibold text-white/85">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-white/45">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-5 flex flex-col gap-4 border-t border-white/[0.07] pt-5">
        <Checkbox
          checked={accepted}
          onChange={(event) => setAccepted(event.currentTarget.checked)}
          color="blue"
          classNames={{
            input: "!border-white/25 !bg-transparent checked:!border-primary checked:!bg-primary",
            label: "!text-xs !leading-5 !text-white/60",
          }}
          label="I understand, agree, and consent to the terms above."
          labelPosition="right"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => modals.closeAll()}
            className="min-h-11 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!accepted}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Link account <MdArrowOutward size={17} />
          </button>
        </div>
      </footer>
    </div>
  );
};
