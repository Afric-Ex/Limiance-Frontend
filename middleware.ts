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
  // Middleware is disabled - all auth is handled client-side
  // because cross-origin cookies are not visible to server-side middleware
  return NextResponse.next();
}

export const config = {
  // API traffic does not pay for middleware at all.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
