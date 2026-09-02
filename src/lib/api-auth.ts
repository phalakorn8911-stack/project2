import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 }) }
  }
  return { session, error: null }
}

export async function requireAdmin() {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if ((session!.user as any).role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 }) }
  }
  return { session, error: null }
}
