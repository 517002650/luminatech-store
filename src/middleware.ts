import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE,
  normalizeAffiliateCode,
} from "./lib/affiliate-cookie";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function applyAffiliateCookie(request: NextRequest, response: NextResponse) {
  const raw = request.nextUrl.searchParams.get("ref");
  const code = normalizeAffiliateCode(raw);
  if (!code) return response;

  response.cookies.set(AFFILIATE_COOKIE, code, {
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    const res = NextResponse.next();
    return applyAffiliateCookie(request, res);
  }

  const response = intlMiddleware(request);
  return applyAffiliateCookie(request, response);
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
