"use client";

import React from "react";
import { UserAvatar } from "../shared/user-avatar";
import { useUserStore } from "@/src/stores/user-store";

export const SquareProfileCard = () => {
  const user = useUserStore((s) => s.user);
  
  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Daniel T";

  return (
    <div className="flex p-4 items-center gap-3">
      <UserAvatar size={55} />
      <div className="flex flex-col">
        <h5 className="font-bold text-lg text-white/90">{displayName}</h5>
        <p className="text-xs text-white/40">
          User ID: {user?.id?.split("-")?.at(-1) ?? "Loading..."}
        </p>
      </div>
      <button className="bg-primary/20 text-primary rounded-lg px-6 py-1.5 text-xs font-bold ml-auto hover:bg-primary hover:text-white transition-colors">
        Follow
      </button>
    </div>
  );
};
