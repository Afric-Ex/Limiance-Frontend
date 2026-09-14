"use client";

import React, { useState } from "react";
import { News } from "./news";
import { MdOutlineClose } from "react-icons/md";

export const NewsMarquee = ({ withClose }: { withClose?: boolean }) => {
  const [visible, setVisible] = useState(true);

  return (
    visible && (
      <div className="relative flex items-center bg-[#181a20] border-y border-white/[0.06] overflow-hidden py-1.5 h-12">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#181a20] to-transparent z-10" />

        {/* Marquee container */}
        <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden custom-scrollbar hide-scrollbar snap-x">
          <div className="flex items-center w-max animate-[shimmer_20s_linear_infinite] hover:[animation-play-state:paused]">
             {/* Note: using a custom css animation class if needed, or simple scrolling */}
            <News />
            <News />
            <News />
            <News />
          </div>
        </div>

        {/* Right side fade and close */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 bg-gradient-to-l from-[#181a20] via-[#181a20] to-transparent pl-8 z-10">
          {withClose && (
            <button
              onClick={() => setVisible(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] transition-all active:scale-95 text-white/50 hover:text-white"
            >
              <MdOutlineClose size={14} />
            </button>
          )}
        </div>
      </div>
    )
  );
};
