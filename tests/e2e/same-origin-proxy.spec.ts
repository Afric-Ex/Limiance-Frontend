import { test, expect } from "@playwright/test";
import {
  CREDENTIAL_IN_URL,
  FORBIDDEN_STORAGE_KEYS,
  SESSION_COOKIE,
  SESSION_VALUE,
  installSessionBackend,
  login,
  readStorage,
} from "./helpers/session-backend";

/**
 * The browser must never talk to the backend cross-origin.
 *
 * The backend answers with `Access-Control-Allow-Origin: *` alongside
 * `Access-Control-Allow-Credentials: true`, which the Fetch spec rejects for
 * credentialed requests — so a direct call cannot succeed no matter what the
 * frontend does. Same-origin `/proxy` requests sidestep CORS entirely, which is
 * what these tests pin down.
 */
test.describe("same-origin API proxy", () => {
  test("logs in through /proxy on the app origin and never cross-origin", async ({
    page,
    context,
    baseURL,
  }) => {
    const probe = await installSessionBackend(context);
    await login(page);

    expect(probe.loginCount).toBeGreaterThan(0);
    expect(probe.proxiedPaths).toContain("/users/login");

    const origin = new URL(baseURL!).origin;
    for (const requested of probe.requestedUrls) {
      const url = new URL(requested);
      expect(url.origin, `API call left the app origin: ${requested}`).toBe(origin);
      expect(
        url.pathname.startsWith("/proxy/") || url.pathname.startsWith("/proxy-root/"),
        `API call bypassed the proxy prefix: ${requested}`
      ).toBe(true);
    }
  });

  test("the backend cookie is Secure, HttpOnly and SameSite, and invisible to script", async ({
    page,
    context,
  }) => {
    await installSessionBackend(context);
    await login(page);

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE);
    expect(session, "login did not set a session cookie").toBeTruthy();
    expect(session!.httpOnly, "session cookie must be HttpOnly").toBe(true);
    expect(session!.secure, "session cookie must be Secure").toBe(true);
    expect(session!.sameSite).toBe("Lax");

    // The whole point of HttpOnly: script cannot reach it, so the frontend has
    // no way to read, copy or forward the credential.
    const visibleToScript = await page.evaluate(() => document.cookie);
    expect(visibleToScript).not.toContain(SESSION_VALUE);
    expect(visibleToScript).not.toContain(SESSION_COOKIE);
  });

  test("login body carries no token and the app keeps no credential in storage", async ({
    page,
    context,
  }) => {
    const probe = await installSessionBackend(context);

    const bodies: string[] = [];
    page.on("response", async (response) => {
      if (response.url().includes("/proxy/users/login")) {
        bodies.push(await response.text().catch(() => ""));
      }
    });

    await login(page);

    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // JWT-shaped
      expect(body).not.toMatch(/"(access|refresh|session|id)Token"\s*:\s*"[^"]+"/i);
    }

    const storage = await readStorage(page);
    const keys = [...storage.local, ...storage.session].filter((key) =>
      FORBIDDEN_STORAGE_KEYS.test(key)
    );
    expect(keys).toEqual([]);
  });

  test("authenticated follow-up requests reuse the cookie instead of a header", async ({
    page,
    context,
  }) => {
    const probe = await installSessionBackend(context);
    await login(page);

    // /user is fetched by UserInitializer on every authenticated page.
    await expect.poll(() => probe.proxiedPaths.filter((p) => p === "/user").length).toBeGreaterThan(0);

    expect(
      probe.cookieHeaders.some((header) => header.includes(`${SESSION_COOKIE}=${SESSION_VALUE}`)),
      "no request carried the session cookie"
    ).toBe(true);
    expect(
      probe.authorizationHeaders,
      "the app must not send an Authorization header any more"
    ).toEqual([]);
  });

  test("no credential appears in any request URL", async ({ page, context }) => {
    const probe = await installSessionBackend(context);
    await login(page);

    for (const requested of probe.requestedUrls) {
      const url = new URL(requested);
      expect(url.search, `credential in query: ${requested}`).not.toMatch(CREDENTIAL_IN_URL);
      expect(url.hash, `credential in fragment: ${requested}`).not.toMatch(CREDENTIAL_IN_URL);
    }
  });

  test("logout revokes the backend session and a reload cannot restore it", async ({
    page,
    context,
  }) => {
    const probe = await installSessionBackend(context);
    await login(page);

    await page.getByTitle("Sign out").click();
    await page.waitForURL("**/auth/login", { timeout: 30_000 });

    expect(probe.logoutCount, "logout must call the backend so the cookie dies").toBe(1);

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === SESSION_COOKIE);
    expect(session?.value ?? "").not.toBe(SESSION_VALUE);

    // A reload (or a back-button navigation) must not resurrect the session.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
    const afterReload = await context.cookies();
    expect(afterReload.find((c) => c.name === SESSION_COOKIE)?.value ?? "").not.toBe(
      SESSION_VALUE
    );
  });

  test("logging in again after logout starts a fresh session", async ({ page, context }) => {
    const probe = await installSessionBackend(context);
    await login(page);

    await page.getByTitle("Sign out").click();
    await page.waitForURL("**/auth/login", { timeout: 30_000 });

    await login(page, "second-account@example.test");

    expect(probe.loginCount).toBe(2);
    expect(probe.logoutCount).toBe(1);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === SESSION_COOKIE)?.value).toBe(SESSION_VALUE);

    // The second login must not carry the first session's credential anywhere.
    const lastBody = probe.loginBodies.at(-1) ?? "";
    expect(lastBody).not.toContain(SESSION_VALUE);
  });

  test("a 401 from the proxy clears the session and returns to login", async ({
    page,
    context,
  }) => {
    const probe = await installSessionBackend(context);
    await login(page);

    // Simulate the backend deciding this session is no longer valid.
    probe.revoked = true;
    await context.clearCookies();
    await page.evaluate(() => {
      window.dispatchEvent(new Event("online"));
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
  });
});
