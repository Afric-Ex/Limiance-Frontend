"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wsClient } from "@/src/lib/websocket-client";
import {
  sendTypingWs,
  subscribeChatEvents,
  type ChatTypingEvent,
  type ChatWsMessage,
} from "@/src/lib/chat-ws";

/** Live connection state of the shared trading socket. */
export function useWsConnected(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => wsClient.onStatusChange(setConnected), []);

  return connected;
}

/**
 * Subscribe to §8 chat pushes for one conversation and report whether the
 * socket is connected. Handlers are read through a ref so passing inline
 * callbacks does not resubscribe on every render.
 */
export function useChatWs(
  chatId: string | null | undefined,
  handlers: {
    onMessage?: (message: ChatWsMessage) => void;
    onTyping?: (event: ChatTypingEvent) => void;
  }
): { connected: boolean } {
  const handlersRef = useRef(handlers);
  const connected = useWsConnected();

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!chatId) return;
    return subscribeChatEvents({
      onMessage: (message) => {
        if (message.chatId !== chatId) return;
        handlersRef.current.onMessage?.(message);
      },
      onTyping: (event) => {
        if (event.chatId !== chatId) return;
        handlersRef.current.onTyping?.(event);
      },
    });
  }, [chatId]);

  return { connected };
}

/**
 * Typing state for one conversation: `peerTyping` for the remote participant's
 * indicator, `notifyTyping` for outgoing typing_response frames (debounced so
 * one "started" frame is sent per typing burst, followed by "stopped").
 */
export function useTypingIndicator(
  chatId: string | null | undefined,
  currentUserId?: string
) {
  const [peerTyping, setPeerTyping] = useState(false);
  const peerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentTyping = useRef(false);

  useEffect(() => {
    setPeerTyping(false);
    sentTyping.current = false;
    if (peerTimer.current) clearTimeout(peerTimer.current);
    if (localTimer.current) clearTimeout(localTimer.current);
  }, [chatId]);

  useEffect(
    () => () => {
      if (sentTyping.current && chatId) sendTypingWs(chatId, false);
      if (peerTimer.current) clearTimeout(peerTimer.current);
      if (localTimer.current) clearTimeout(localTimer.current);
    },
    [chatId]
  );

  const onTyping = useCallback(
    (event: ChatTypingEvent) => {
      if (!chatId || event.chatId !== chatId) return;
      if (currentUserId && event.senderId === currentUserId) return;

      setPeerTyping(event.isTyping);
      if (peerTimer.current) clearTimeout(peerTimer.current);
      if (event.isTyping) {
        peerTimer.current = setTimeout(() => setPeerTyping(false), 5_000);
      }
    },
    [chatId, currentUserId]
  );

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!chatId) return;

      if (isTyping) {
        if (!sentTyping.current) {
          sendTypingWs(chatId, true);
          sentTyping.current = true;
        }
        if (localTimer.current) clearTimeout(localTimer.current);
        localTimer.current = setTimeout(() => {
          sendTypingWs(chatId, false);
          sentTyping.current = false;
        }, 3_000);
        return;
      }

      if (localTimer.current) clearTimeout(localTimer.current);
      if (sentTyping.current) {
        sendTypingWs(chatId, false);
        sentTyping.current = false;
      }
    },
    [chatId]
  );

  return { peerTyping, onTyping, notifyTyping };
}
