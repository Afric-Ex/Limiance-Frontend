"use client";

import React, { ComponentProps, useState } from "react";
import { useUserStore } from "@/src/stores/user-store";
import Avatar from "boring-avatars";

interface UserAvatarProps extends ComponentProps<"div"> {
  size?: number;
  className?: string;
}

export const UserAvatar = ({ size = 26, className = "" }: UserAvatarProps) => {
  const user = useUserStore((s) => s.user);
  const [imgError, setImgError] = useState(false);

  const generatedName = user?.id || user?.username || user?.email || "User";

  if (user?.photo && !imgError) {
    return (
      <img
        src={user.photo}
        alt="User Avatar"
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`rounded-full overflow-hidden flex shrink-0 items-center justify-center bg-primary/20 ${className}`} style={{ width: size, height: size, minWidth: size, minHeight: size }}>
      <Avatar
        size={size}
        name={generatedName}
        variant="beam"
        colors={["#4d77f0", "#181a20", "#3354c4", "#0ECB81", "#F6465D"]}
      />
    </div>
  );
};
