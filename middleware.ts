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

  // Check both cookie names - the backend might send either
  const token = req.cookies.get(SESSION_COOKIE)?.value || req.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  const isProtected = !pathname.startsWith("/auth") && pathname !== "/";

  console.log(`[Middleware] Path: ${pathname}, Has token: ${!!token}, Is protected: ${isProtected}`);

  // NOTE: We cannot rely on cookies in middleware because:
  // 1. The backend is on a different domain (cross-origin)
  // 2. Server-side middleware doesn't have access to cross-origin cookies
  // 3. The session cookie is set by the backend but not visible here
  // 
  // Instead, auth is validated by:
  // - UserInitializer component (client-side) which fetches /user_details
  // - API interceptor which redirects to login on 401
  // - Individual page components which redirect if not authenticated
  //
  // So we allow all navigations here and let the client-side auth handle it.

  return clearLegacySessionCookie(NextResponse.next());
}

export const config = {
  // API traffic does not pay for middleware at all.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
