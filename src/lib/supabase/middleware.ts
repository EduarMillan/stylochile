import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PREFIXES = ["/dashboard", "/salon/"];
const AUTH_ROUTES = ["/login", "/signup"];
const SUPER_ADMIN_PREFIX = "/admin";
const SUPER_ADMIN_EMAIL = "eduarmillan00@gmail.com";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const inAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const inAuth = AUTH_ROUTES.includes(pathname);
  const inSuperAdmin =
    pathname === SUPER_ADMIN_PREFIX ||
    pathname.startsWith(`${SUPER_ADMIN_PREFIX}/`);

  // Super-admin: solo el email designado entra a /admin/*
  if (inSuperAdmin) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user && inAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && inAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
