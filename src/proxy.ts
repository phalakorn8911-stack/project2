import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const roleAccess: Record<string, string[]> = {
  admin: [
    "/dashboard", "/vehicles", "/vehicle-types", "/units", "/drivers",
    "/maintenance-plans", "/work-orders", "/parts", "/reports",
    "/ai-assistant", "/users", "/settings", "/notifications",
  ],
  mechanic: [
    "/dashboard", "/vehicles", "/drivers", "/maintenance-plans",
    "/work-orders", "/parts", "/reports", "/ai-assistant", "/notifications",
  ],
  driver: [
    "/dashboard", "/vehicles", "/drivers", "/ai-assistant", "/notifications",
  ],
}

export async function proxy(request: Request) {
  const url = new URL(request.url)

  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  const role = token.role as string
  const path = url.pathname

  if (role && roleAccess[role]) {
    const allowed = roleAccess[role].some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    )

    if (!allowed) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/vehicle-types/:path*",
    "/units/:path*",
    "/drivers/:path*",
    "/maintenance-plans/:path*",
    "/work-orders/:path*",
    "/parts/:path*",
    "/reports/:path*",
    "/ai-assistant/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
}
