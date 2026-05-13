import { NextResponse, type NextRequest } from "next/server";

import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
  supportedLocales,
  withLocalePath
} from "@/shared/i18n/locales";

const publicFilePattern = /\.[^/]+$/;

function getPreferredLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptedLanguages = request.headers.get("accept-language")?.split(",") ?? [];
  const normalizedLanguages = acceptedLanguages.map((language) => language.split(";")[0].trim().toLowerCase());
  const matchedLocale = supportedLocales.find((locale) => {
    const normalizedLocale = locale.toLowerCase();

    return normalizedLanguages.some(
      (language) => language === normalizedLocale || language.split("-")[0] === normalizedLocale.split("-")[0]
    );
  });

  return matchedLocale ?? defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    publicFilePattern.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1];

  if (isSupportedLocale(firstSegment)) {
    const response = NextResponse.next();
    response.cookies.set(localeCookieName, firstSegment, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax"
    });

    return response;
  }

  const locale = getPreferredLocale(request);
  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = pathname === "/" ? `/${locale}/dashboard` : withLocalePath(pathname, locale);

  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
