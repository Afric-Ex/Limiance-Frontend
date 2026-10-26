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

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  // API traffic does not pay for middleware at all.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
