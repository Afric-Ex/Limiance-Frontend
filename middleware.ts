import { NextRequest, NextResponse } from "next/server";

/**
 * Name of the session cookie the backend sets. Read here on the server only —
 * it is HttpOnly, so nothing in the browser can read it, and nothing in the
 * browser should try.
 */
const SESSION_COOKIE = "limiance_session";
const LEGACY_SESSION_COOKIE = "__Host-limiance_session";

const clearLegacySessionCookie = (response: NextResponse): NextResponse => {
  response.cookies.set(LEGACY_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
};

/**
 * Paths that must reach Next.js untouched.
 *
 * `/proxy`, `/proxy-root` and `/ws-proxy` are the same-origin API/WebSocket
 * passthroughs. Redirecting them to the login page turns a JSON API call into
 * an HTML page (a `POST /proxy/users/login` becomes a 307 to `/auth/login` and
 * then a 405), which is what surfaced as a login failure. The authenticated
 * check belongs to the pages below, not to the tunnel.
 */
const PASSTHROUGH_PREFIXES = ["/proxy", "/proxy-root", "/ws-proxy"];

const isPassthrough = (pathname: string): boolean =>
  PASSTHROUGH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPassthrough(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isProtected = !pathname.startsWith("/auth") && pathname !== "/";

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return clearLegacySessionCookie(NextResponse.redirect(url));
  }

  // A stale HttpOnly cookie can remain after an API 401. Keep auth pages
  // reachable so the client can show login instead of bouncing back to a
  // protected page that will immediately fail authentication again.
  return clearLegacySessionCookie(NextResponse.next());
}

export const config = {
  // `proxy` and `ws-proxy` are excluded here as well as inside the handler so
  // API traffic does not pay for middleware at all.
  matcher: "/((?!api|_next|proxy|ws-proxy|.*\\..*).*)",
};
