export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.rank !== undefined) updateData.rank = body.rank
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.email !== undefined) updateData.email = body.email
    if (body.roleId !== undefined) updateData.roleId = body.roleId
    if (body.unitId !== undefined) updateData.unitId = body.unitId
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
      id: user.id,
      name: user.name,
      rank: user.rank,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
