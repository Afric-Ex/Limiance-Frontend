"use client";

import { useEffect, useState } from "react";
import { wsClient } from "@/src/lib/websocket-client";

export function useWsConnected(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => wsClient.onStatusChange(setConnected), []);

  return connected;
}
