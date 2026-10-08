export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireAuth, isAdminLike } from "@/lib/api-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  // กันยกระดับสิทธิ์: เฉพาะ admin แก้ไขผู้ใช้อื่นได้
  if (!isAdminLike((session!.user as any).role)) {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    const fields = [
      "rank", "firstName", "lastName", "email", "roleId", "unitId",
      "address", "maritalStatus", "education", "nationalId",
      "civilianLicense", "armyLicense",
    ]
    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }
    // FK ว่าง ("") ต้องเป็น null ไม่เช่นนั้น Prisma โยน P2003
    if (updateData.unitId === "") updateData.unitId = null
    if (updateData.roleId === "") delete updateData.roleId
    if (body.password && body.password.trim()) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    // Auto-sync name from firstName/lastName
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const current = await prisma.user.findUnique({ where: { id } })
      const fn = body.firstName !== undefined ? body.firstName : (current?.firstName ?? "")
      const ln = body.lastName !== undefined ? body.lastName : (current?.lastName ?? "")
      updateData.name = `${fn} ${ln}`.trim() || current?.name || ""
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: user.id, name: user.name, rank: user.rank,
      firstName: user.firstName, lastName: user.lastName, email: user.email,
      address: user.address, maritalStatus: user.maritalStatus,
      education: user.education, nationalId: user.nationalId,
      civilianLicense: user.civilianLicense, armyLicense: user.armyLicense,
    })
  } catch (error: any) {
    console.error("Update user error:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "อีเมลซ้ำกับผู้ใช้อื่น" }, { status: 409 })
    }
    if (error.code === "P2003") {
      return NextResponse.json({ error: "บทบาทหรือหน่วยงานไม่ถูกต้อง" }, { status: 400 })
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  if (!isAdminLike((session!.user as any).role)) {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 })
  }
  try {
    const { id } = await params
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Delete user error:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ที่ต้องการลบ" }, { status: 404 })
    }
    if (error.code === "P2003") {
      return NextResponse.json({ error: "ไม่สามารถลบได้ มีรายการที่เกี่ยวข้อง" }, { status: 409 })
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
