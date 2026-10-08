import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const roleAccess: Record<string, string[]> = {
  admin: [
    "/dashboard", "/vehicles", "/vehicle-types", "/units", "/drivers",
    "/maintenance-plans", "/work-orders", "/parts", "/reports",
    "/ai-assistant", "/users", "/settings", "/notifications", "/gps-tracking", "/profile", "/download",
  ],
  // ผบ. = admin
  commander: [
    "/dashboard", "/vehicles", "/vehicle-types", "/units", "/drivers",
    "/maintenance-plans", "/work-orders", "/parts", "/reports",
    "/ai-assistant", "/users", "/settings", "/notifications", "/gps-tracking", "/profile", "/download",
  ],
  mechanic: [
    "/dashboard", "/vehicles", "/drivers", "/maintenance-plans",
    "/work-orders", "/parts", "/reports", "/ai-assistant", "/notifications", "/profile", "/download",
  ],
  // หัวหน้าช่าง = ช่าง
  head_mechanic: [
    "/dashboard", "/vehicles", "/drivers", "/maintenance-plans",
    "/work-orders", "/parts", "/reports", "/ai-assistant", "/notifications", "/profile", "/download",
  ],
  driver: [
    "/dashboard", "/vehicles", "/drivers", "/ai-assistant", "/notifications", "/profile", "/download",
  ],
  // นายทหารยานยนต์
  vehicle_officer: [
    "/dashboard", "/vehicles", "/vehicle-types", "/drivers", "/reports",
    "/ai-assistant", "/notifications", "/profile", "/download",
  ],
  // นายทหารคลังอะไหล่
  parts_officer: [
    "/dashboard", "/parts", "/reports",
    "/ai-assistant", "/notifications", "/profile", "/download",
  ],
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  const role = token.role as string
  const path = url.pathname

  // fail-closed: role ที่ไม่รู้จักอยู่ได้แค่ dashboard
  const allowed = roleAccess[role]
  if (!allowed) {
    if (path !== "/dashboard" && !path.startsWith("/dashboard/")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (!allowed.some((prefix) => path === prefix || path.startsWith(prefix + "/"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
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
    "/gps-tracking/:path*",
    "/profile/:path*",
    "/download/:path*",
  ],
}
