"use client";

import { useEffect } from "react";
import { useUserStore } from "@/src/stores/user-store";
import { useQuery } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";

export function UserInitializer() {
  const fetchUser = useUserStore((state) => state.fetchUser);
  const hydrated = useUserStore((state) => state.hydrated);

  useQuery({
    queryKey: userKeys.settings,
    queryFn: userService.getSettings,
    select: (response) => response.data,
  });

  useEffect(() => {
    if (!hydrated) void fetchUser();
  }, [fetchUser, hydrated]);

  return null;
}
