import type { BrowserContext, Page, Route } from "@playwright/test";

/**
 * A stand-in for the cookie-session backend.
 *
 * The backend authenticates with an HttpOnly session cookie, so the browser
 * tests model the production cookie name and attributes: `GET /proxy/user`
 * answers from that cookie,
 * `POST /proxy/users/logout` expires it, and no endpoint ever returns a token in
 * its body. Everything third-party is blocked, so a test never depends on the
 * captcha vendor, the price feed or the real backend being up.
 */

export const SESSION_COOKIE = "__Host-limiance_session";
export const SESSION_VALUE = "opaque-session-value";
export const SESSION_COOKIE_ATTRS = "Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax";

export interface BackendProbe {
  /** Paths (after the proxy prefix) the app asked the backend for. */
  proxiedPaths: string[];
  /** Every URL the page requested, page loads and XHR alike. */
  requestedUrls: string[];
  loginCount: number;
  logoutCount: number;
  /** Cookie headers the mock backend received, in order. */
  cookieHeaders: string[];
  /** Any Authorization header the app attached. Non-empty is a failure. */
  authorizationHeaders: string[];
  /** Bodies the app received from the login endpoint. */
  loginBodies: string[];
  /** Set once the mock backend has expired the session cookie. */
  revoked: boolean;
}

const jsonResponse = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const MOCK_USER = {
  id: "user-1",
  email: "trader@example.test",
  username: "trader",
  firstName: "Test",
  lastName: "Trader",
  kycStatus: "not_submitted",
  isIDverified: false,
};

const isLocal = (hostname: string) => hostname === "127.0.0.1" || hostname === "localhost";

export const installSessionBackend = async (context: BrowserContext): Promise<BackendProbe> => {
  const probe: BackendProbe = {
    proxiedPaths: [],
    requestedUrls: [],
    loginCount: 0,
    logoutCount: 0,
    cookieHeaders: [],
    authorizationHeaders: [],
    loginBodies: [],
    revoked: false,
  };

  await context.route("**/*", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const isProxyPath =
      url.pathname.startsWith("/proxy/") ||
      url.pathname.startsWith("/proxy-root/") ||
      url.pathname === "/proxy" ||
      url.pathname === "/proxy-root";

    if (!isProxyPath) {
      // App assets and documents load for real; every other origin is refused so
      // tests stay hermetic.
      return isLocal(url.hostname) ? route.fallback() : route.abort();
    }

    probe.requestedUrls.push(request.url());

    const authorization = request.headers().authorization;
    if (authorization) probe.authorizationHeaders.push(authorization);

    const cookieHeader = request.headers().cookie ?? "";
    if (cookieHeader) probe.cookieHeaders.push(cookieHeader);

    const path = url.pathname.replace(/^\/proxy-root/, "").replace(/^\/proxy/, "");
    probe.proxiedPaths.push(path);

    const hasSession = cookieHeader.includes(`${SESSION_COOKIE}=${SESSION_VALUE}`);

    if (path === "/users/login") {
      probe.loginCount += 1;
      probe.loginBodies.push(request.postData() ?? "");
      return route.fulfill({
        ...jsonResponse({
          statusCode: 200,
          success: true,
          // Note the absence of accessToken/refreshToken: the credential is the
          // Set-Cookie below and nothing else.
          data: { user: MOCK_USER },
        }),
        headers: { "set-cookie": `${SESSION_COOKIE}=${SESSION_VALUE}; ${SESSION_COOKIE_ATTRS}` },
      });
    }

    if (path === "/users/logout") {
      probe.logoutCount += 1;
      probe.revoked = true;
      return route.fulfill({
        ...jsonResponse({ statusCode: 200, success: true }),
        headers: {
          "set-cookie": `${SESSION_COOKIE}=; ${SESSION_COOKIE_ATTRS}; Max-Age=0`,
        },
      });
    }

    if (!hasSession) {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ statusCode: 401, error: "unauthorized", message: "" }),
      });
    }

    if (path === "/user") return route.fulfill(jsonResponse({ data: MOCK_USER }));

    return route.fulfill(jsonResponse({ data: {} }));
  });

  return probe;
};

const CREDENTIAL_IN_URL =
  /(?:__Host-limiance_session|auth-token|access[_-]?token|refresh[_-]?token|bearer|verify-token|authorization|session[_-]?token)=/i;

/**
 * Clicking a server-rendered form before React attaches its handlers performs a
 * native GET submission (the browser just reloads the page) instead of calling
 * `onSubmit`, so no API request is ever made. Wait until React has actually
 * claimed the form node.
 */
export const waitForHydration = async (page: Page) => {
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("form")).some((form) =>
        Object.keys(form).some((key) => key.startsWith("__reactProps$"))
      ),
    undefined,
    { timeout: 60_000 }
  );
};

export const login = async (page: Page, email = "trader@example.test") => {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  await waitForHydration(page);
  // The page renders the same form twice (email tab + disabled sub-account
  // tab), so scope to the first one instead of tripping strict mode.
  const form = page.locator("form").first();
  await form.getByLabel("Email / Number").fill(email);
  await form.getByLabel("Password", { exact: true }).fill("Sup3rSecret@x");
  await form.getByRole("button", { name: /^log in$/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
};

export const readStorage = (page: Page) =>
  page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));

export const FORBIDDEN_STORAGE_KEYS =
  /(?:auth-token|auth-store|user-store|verify-token|password|otp|access.?token|refresh.?token|session)/i;

export { CREDENTIAL_IN_URL };
