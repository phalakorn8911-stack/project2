import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/vehicles/:path*", "/maintenance-plans/:path*", "/work-orders/:path*", "/parts/:path*", "/reports/:path*", "/ai-assistant/:path*", "/notifications/:path*", "/users/:path*", "/settings/:path*"],
}
