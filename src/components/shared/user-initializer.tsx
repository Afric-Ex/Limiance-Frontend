"use client";

import { useEffect } from "react";
import { useUserStore } from "@/src/stores/user-store";

export function UserInitializer() {
  const fetchUser = useUserStore((state) => state.fetchUser);
  const hydrated = useUserStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) void fetchUser();
  }, [fetchUser, hydrated]);

  return null;
}
