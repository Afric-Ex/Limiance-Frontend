/**
 * WebSocket target resolution, kept free of DOM and module imports so it can be
 * reasoned about (and tested) on its own.
 *
 * The rule this encodes: the handshake is either same-origin or explicitly
 * configured, and never carries a credential. Nothing is ever appended to the
 * URL — tokens in a URL leak into proxy logs, browser history and
 * `Sec-WebSocket-Protocol` echoes — so the session is whatever cookie the
 * browser already holds for the origin.
 */

export const WS_PROXY_PATH = "/ws-proxy";

export interface SocketTargetInput {
  /** `window.location.protocol` of the page opening the socket. */
  pageProtocol: string;
  /** `window.location.host` of the page opening the socket. */
  host: string;
  /** False only when a deployment explicitly opted out of the same-origin proxy. */
  useSameOriginProxy: boolean;
  /** Explicit `ws://`/`wss://` endpoint, used only when the proxy is off. */
  directUrl?: string;
}

const isUsableHost = (host: string): boolean => Boolean(host) && !/[/\\@\s]/.test(host);

/**
 * Returns the URL to open, or `null` when nothing valid is configured — the
 * caller must then stay disconnected rather than guess.
 */
export const resolveSocketTarget = ({
  pageProtocol,
  host,
  useSameOriginProxy,
  directUrl,
}: SocketTargetInput): string | null => {
  // An insecure page must not open a TLS socket: mixed content is blocked, and a
  // fallback to plaintext would expose frames the cookie protects.
  const scheme = pageProtocol === "https:" ? "wss" : "ws";

  if (useSameOriginProxy) {
    return isUsableHost(host) ? `${scheme}://${host}${WS_PROXY_PATH}` : null;
  }

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

  parsed.protocol = `${scheme}:`;
  return parsed.toString();
};