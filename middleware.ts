import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  localeHeaderName,
  locales,
  type Locale,
} from "./i18n/routing";

const FILE_EXTENSION_RE = /\.[^/]+$/;
const LOCALE_LIKE_RE = /^[a-z]{2}(-[a-z]{2,})?$/i;

const localeCookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

function detectLocale(req: NextRequest): Locale {
  const cookieLocale = req.cookies.get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = req.headers.get("accept-language") ?? "";
  for (const entry of acceptLanguage.split(",")) {
    const tag = entry.split(";")[0].trim().toLowerCase();
    if (!tag) continue;
    if (isLocale(tag)) return tag;
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }

  return defaultLocale;
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never localize API traffic, static assets, or files with an extension.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__next") ||
    FILE_EXTENSION_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // Already localized: strip the locale prefix for the internal rewrite and
  // expose the active locale to the server-side translation config.
  if (first && isLocale(first)) {
    const rest = `/${segments.slice(1).join("/")}`;
    const url = req.nextUrl.clone();
    url.pathname = rest === "/" ? "/" : rest;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(localeHeaderName, first);

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.headers.set(localeHeaderName, first);
    response.cookies.set(localeCookieName, first, localeCookieOptions);
    return response;
  }

  // Unknown locale-looking prefixes (e.g. /xx/dashboard) fall back to the
  // default locale rather than rendering a broken route.
  if (first && LOCALE_LIKE_RE.test(first) && !locales.includes(first as Locale)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname.replace(/^\/[^/]+/, "")}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(localeCookieName, defaultLocale, localeCookieOptions);
    return response;
  }

  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(localeCookieName, locale, localeCookieOptions);
  return response;
}

export const config = {
  // API traffic does not pay for middleware at all.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
