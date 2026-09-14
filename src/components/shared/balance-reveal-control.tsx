"use client";

import React, { ComponentProps } from "react";
import { Eye } from "../icons/eye";
import { useUserStore } from "@/src/stores/user-store";
import { BsEyeSlashFill } from "react-icons/bs";

export const BalanceRevealControl = (props?: ComponentProps<"svg">) => {
  const hideBalance = useUserStore((state) => state.hideBalance);
  const setHideBalance = useUserStore((state) => state.setHideBalance);
  return hideBalance ? (
    <Eye
      className="cursor-pointer w-5 h-5 hover:opacity-50 duration-200"
      onClick={() => setHideBalance(false)}
      {...props}
    />
  ) : (
    <BsEyeSlashFill
      className="cursor-pointer w-5 h-5 hover:opacity-50 duration-200"
      size={20}
      onClick={() => setHideBalance(true)}
      {...props}
    />
  );
};
