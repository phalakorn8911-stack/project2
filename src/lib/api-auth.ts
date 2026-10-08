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

// ผบ. (commander) = admin, หัวหน้าช่าง (head_mechanic) = ช่าง
export function isAdminLike(role: string | undefined) {
  return role === "admin" || role === "commander"
}

export function isMechanicLike(role: string | undefined) {
  return role === "mechanic" || role === "head_mechanic" || isAdminLike(role)
}

// คลังอะไหล่ (parts_officer) ปรับสต็อกได้
export function canAdjustStock(role: string | undefined) {
  return isMechanicLike(role) || role === "parts_officer"
}

export async function requireAdmin() {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if (!isAdminLike((session!.user as any).role)) {
    return { session: null, error: NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 }) }
  }
  return { session, error: null }
}
