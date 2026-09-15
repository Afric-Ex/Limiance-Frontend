"use client";

import React, { ComponentProps } from "react";
import { Eye } from "../icons/eye";
import { useBalanceCloakStore } from "@/src/stores/balance-cloak-store";
import { useUserStore } from "@/src/stores/user-store";
import { BsEyeSlashFill } from "react-icons/bs";

export const BalanceRevealControl = (props?: ComponentProps<"svg">) => {
  const enabled = useBalanceCloakStore((s) => s.enabled);
  const legacyHide = useUserStore((s) => s.hideBalance);
  const hideBalance = enabled || legacyHide;
  const toggleCloak = useBalanceCloakStore((s) => s.toggleCloak);
  return hideBalance ? (
    <Eye
      className="cursor-pointer w-5 h-5 hover:opacity-50 duration-200"
      onClick={() => toggleCloak()}
      {...props}
    />
  ) : (
    <BsEyeSlashFill
      className="cursor-pointer w-5 h-5 hover:opacity-50 duration-200"
      size={20}
      onClick={() => toggleCloak()}
      {...props}
    />
  );
};
