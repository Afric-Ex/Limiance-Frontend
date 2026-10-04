import { test, expect } from "@playwright/test";
import { resolveSocketTarget } from "../../src/lib/ws-url";

/**
 * WebSocket handshake contract.
 *
 * The socket must be same-origin and carry nothing that identifies the session.
 * Tokens in a URL leak into proxy logs, browser history and
 * `Sec-WebSocket-Protocol` echoes, so the resolved target is asserted to be bare.
 */

const proxyTarget = (pageProtocol = "https:", host = "app.limiance.test") =>
  resolveSocketTarget({ pageProtocol, host, useSameOriginProxy: true });

test.describe("WebSocket target resolution", () => {
  test("defaults to a same-origin /ws-proxy on a secure page", () => {
    expect(proxyTarget("https:", "app.limiance.test")).toBe("wss://app.limiance.test/ws-proxy");
  });

  test("uses ws:// on plain http and keeps the port", () => {
    expect(proxyTarget("http:", "localhost:3000")).toBe("ws://localhost:3000/ws-proxy");
  });

  test("never puts a credential in the URL", () => {
    for (const host of ["app.limiance.test", "localhost:3000", "127.0.0.1:8080"]) {
      for (const pageProtocol of ["https:", "http:"]) {
        const url = new URL(proxyTarget(pageProtocol, host)!);
        expect(url.search).toBe("");
        expect(url.hash).toBe("");
        expect(url.username).toBe("");
        expect(url.password).toBe("");
        expect(url.toString()).not.toMatch(/token|jwt|bearer|session|auth/i);
      }
    }
  });

  test("refuses a proxy target when the host is unusable", () => {
    for (const host of ["", "app.example.test/path", "user@app.example.test", "app example.test"]) {
      expect(proxyTarget("https:", host), `accepted host ${JSON.stringify(host)}`).toBeNull();
    }
  });

  test("honours an explicit direct endpoint when the proxy is opted out of", () => {
    expect(
      resolveSocketTarget({
        pageProtocol: "https:",
        host: "app.limiance.test",
        useSameOriginProxy: false,
        directUrl: "ws://stream.limiance.test/api/v1/ws",
      })
      // A secure page must not silently downgrade a socket to plaintext.
    ).toBe("wss://stream.limiance.test/api/v1/ws");
  });

  test("refuses direct endpoints that are unsafe or unconfigured", () => {
    const rejected: (string | undefined)[] = [
      undefined,
      "",
      "not a url",
      "https://stream.limiance.test/ws",
      "http://stream.limiance.test/ws",
      // Configuration is not a channel for a session.
      "ws://user:pass@stream.limiance.test/ws",
      "ws://stream.limiance.test/ws?token=abc",
      "ws://stream.limiance.test/ws#token",
    ];
    for (const directUrl of rejected) {
      expect(
        resolveSocketTarget({
          pageProtocol: "https:",
          host: "app.limiance.test",
          useSameOriginProxy: false,
          directUrl,
        }),
        `accepted ${String(directUrl)}`
      ).toBeNull();
    }
  });

  test("an unusable direct endpoint is ignored while the proxy is on", () => {
    // The opt-out is the only thing that can select a direct URL; a stray
    // NEXT_PUBLIC_WS_URL must not take effect behind the proxy's back.
    expect(
      resolveSocketTarget({
        pageProtocol: "https:",
        host: "app.limiance.test",
        useSameOriginProxy: true,
        directUrl: "wss://stream.limiance.test/ws",
      })
    ).toBe("wss://app.limiance.test/ws-proxy");
  });
});