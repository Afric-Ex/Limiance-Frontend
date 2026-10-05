import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { resolveBackendUrls, resolveBackendUrlsFromEnv } from "../../src/lib/backend-url";
import { redactDiagnostic, sanitizeUrl } from "../../src/lib/pii-policy";
import middleware from "../../middleware";

/**
 * Pure-function checks for the pieces the migration rests on. These need no
 * browser, so they stay fast and deterministic.
 */

test.describe("backend URL normalization", () => {
  test("expands a bare origin and keeps an explicit /api/v1 intact", () => {
    expect(resolveBackendUrls("https://api.example.test")).toEqual({
      apiBaseUrl: "https://api.example.test/api/v1",
      rootBaseUrl: "https://api.example.test",
    });
    expect(resolveBackendUrls("https://api.example.test/api/v1")).toEqual({
      apiBaseUrl: "https://api.example.test/api/v1",
      rootBaseUrl: "https://api.example.test",
    });
  });

  test("tolerates trailing slashes and surrounding whitespace", () => {
    expect(resolveBackendUrls("  https://api.example.test/api/v1///  ")?.apiBaseUrl).toBe(
      "https://api.example.test/api/v1"
    );
  });

  test("refuses anything that could re-point the proxy elsewhere", () => {
    // These values are interpolated into rewrite destinations, so a bad config
    // must fail loudly rather than silently proxy somewhere unexpected.
    const rejected = [
      undefined,
      "",
      "   ",
      "//evil.example",
      "javascript:alert(1)",
      "file:///etc/passwd",
      "https://user:pass@api.example.test",
      "https://api.example.test?next=https://evil.example",
      "https://api.example.test#frag",
      "not a url",
    ];
    for (const value of rejected) {
      expect(resolveBackendUrls(value), `accepted ${String(value)}`).toBeNull();
    }
  });

  test("prefers the server-only variable over the public one", () => {
    expect(
      resolveBackendUrlsFromEnv({
        BACKEND_URL: "https://internal.example.test",
        NEXT_PUBLIC_API_URL: "https://public.example.test",
      })?.apiBaseUrl
    ).toBe("https://internal.example.test/api/v1");

    // Deployments that only set the public name still work.
    expect(
      resolveBackendUrlsFromEnv({ NEXT_PUBLIC_API_URL: "https://public.example.test" })?.apiBaseUrl
    ).toBe("https://public.example.test/api/v1");

    expect(resolveBackendUrlsFromEnv({})).toBeNull();
  });
});

test.describe("session redirects", () => {
  test("keeps login reachable when a stale session cookie remains", () => {
    const request = new NextRequest("https://app.example.test/auth/login", {
      headers: { cookie: "__Host-limiance_session=stale" },
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  test("still redirects protected pages to login when there is no session", () => {
    const request = new NextRequest("https://app.example.test/dashboard");

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.test/auth/login");
  });
});

test.describe("diagnostic redaction", () => {
  test("strips query strings and fragments from URLs", () => {
    expect(sanitizeUrl("https://app.example.test/proxy/user?email=a@b.test&otp=123456")).toBe(
      "https://app.example.test/proxy/user"
    );
    // Relative paths are resolved against a placeholder origin outside the
    // browser; the query string still must not survive.
    expect(sanitizeUrl("/proxy/user?token=abc")).toBe("http://localhost/proxy/user");
    expect(sanitizeUrl("not a url?token=abc")).not.toContain("token");
  });

  test("redacts credential-bearing keys and message-like values", () => {
    // The shape the client actually logs for a failed request.
    const redacted = redactDiagnostic({
      email: "trader@example.test",
      password: "Sup3rSecret@x",
      accessToken: "eyJhbGciOi.x.y",
      headers: { cookie: "auth-token=abc", authorization: "Bearer abc" },
      url: "https://app.example.test/proxy/user?otp=123456",
      error: "unauthorized",
      responseMessage: "Account is not verified, resend verification code",
      responseKeys: ["error", "message"],
    }) as Record<string, unknown>;

    expect(redacted.email).toBe("[REDACTED]");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.accessToken).toBe("[REDACTED]");
    expect(redacted.error).toBe("[REDACTED]");
    expect(redacted.responseMessage).toBe("[REDACTED]");
    expect(redacted.url).toBe("https://app.example.test/proxy/user");
    // A request header block is dropped wholesale — a `Set-Cookie`/`Cookie`
    // value under it is the session itself, so there is nothing safe to walk into.
    expect(redacted.headers).toBe("[REDACTED]");
    // Non-sensitive metadata is kept, so diagnostics stay useful.
    expect(redacted.responseKeys).toEqual(["error", "message"]);

    const dumped = JSON.stringify(redacted);
    expect(dumped).not.toContain("Sup3rSecret");
    expect(dumped).not.toContain("auth-token=abc");
    expect(dumped).not.toContain("Bearer abc");
    expect(dumped).not.toContain("trader@example.test");
    expect(dumped).not.toContain("123456");
  });

  test("redacts cookie values, which are credentials under a friendly name", () => {
    const dumped = JSON.stringify(
      redactDiagnostic({
        cookie: "auth-token=abc123",
        setCookie: "auth-token=abc123; Path=/; HttpOnly",
        headers: { cookie: "auth-token=abc123" },
        nested: { deep: { cookie: "auth-token=abc123" } },
      })
    );
    expect(dumped).not.toContain("abc123");
  });

  test("survives circular structures", () => {
    const circular: Record<string, unknown> = { name: "loop" };
    circular.self = circular;
    expect(() => redactDiagnostic(circular)).not.toThrow();
  });

  test("truncates very long values instead of dumping them", () => {
    const redacted = redactDiagnostic({ note: "x".repeat(5000) }) as Record<string, string>;
    expect(redacted.note.length).toBeLessThan(300);
  });
});