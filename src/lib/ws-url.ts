/**
 * WebSocket target resolution, kept free of DOM and module imports so it can be
 * reasoned about (and tested) on its own.
 *
 * The rule this encodes: the handshake is explicitly configured and never
 * carries a credential. Nothing is ever appended to the URL — tokens in a URL
 * leak into proxy logs, browser history and `Sec-WebSocket-Protocol` echoes — so
 * the session is whatever cookie the browser already holds for the target
 * origin.
 */

export interface SocketTargetInput {
  /** `window.location.protocol` of the page opening the socket. */
  pageProtocol: string;
  /** Explicit `ws://`/`wss://` endpoint from `NEXT_PUBLIC_WS_URL`. */
  directUrl?: string;
}

/**
 * Returns the URL to open, or `null` when nothing valid is configured — the
 * caller must then stay disconnected rather than guess.
 */
export const resolveSocketTarget = ({
  pageProtocol,
  directUrl,
}: SocketTargetInput): string | null => {
  if (!directUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(directUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return null;
  // A direct endpoint is configuration, not a place to pass a session.
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;

  // A secure page must not downgrade the socket to plaintext.
  if (pageProtocol === "https:") parsed.protocol = "wss:";
  return parsed.toString();
};
