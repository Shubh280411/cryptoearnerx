import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  const pathname = req.nextUrl.pathname;

  const protectedRoutes = [
    "/wallet", "/deposit", "/withdraw", "/investments", "/earnings",
    "/team", "/referral", "/notifications", "/support", "/profile",
    "/settings", "/staking", "/dashboard",
  ];

  const isProtected = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // Auth pages — if already logged in, redirect to dashboard
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password")) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return res;
  }

  // Banned page — allow for banned users, block for non-banned
  if (pathname === "/banned") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return res;
  }

  // Protected routes — require auth
  if (isProtected || pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user is banned
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("is_admin, is_banned")
        .eq("id", user.id)
        .single();

      // Admin routes — require is_admin
      if (pathname.startsWith("/admin")) {
        if (!profile?.is_admin) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return res;
      }

      // Banned users — redirect to /banned
      if (profile?.is_banned) {
        return NextResponse.redirect(new URL("/banned", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/wallet/:path*",
    "/deposit/:path*",
    "/withdraw/:path*",
    "/investments/:path*",
    "/earnings/:path*",
    "/team/:path*",
    "/referral/:path*",
    "/notifications/:path*",
    "/support/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/staking/:path*",
    "/banned",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
