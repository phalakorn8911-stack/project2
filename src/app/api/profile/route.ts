export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, email: true, name: true, rank: true,
        firstName: true, lastName: true, address: true,
        maritalStatus: true, education: true, nationalId: true,
        civilianLicense: true, armyLicense: true, photoUrl: true,
        role: true, unit: true, status: true,
      },
    })
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 })

    const body = await request.json()
    const updateData: any = {}

    const textFields = [
      "firstName", "lastName", "email", "rank",
      "address", "maritalStatus", "education",
      "nationalId", "civilianLicense", "armyLicense",
    ]
    for (const field of textFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    if (body.password && body.password.trim()) {
      if (body.password.length < 4) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" }, { status: 400 })
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const current = await prisma.user.findUnique({ where: { id: session.user.id } })
      const fn = body.firstName !== undefined ? body.firstName : (current?.firstName ?? "")
      const ln = body.lastName !== undefined ? body.lastName : (current?.lastName ?? "")
      updateData.name = `${fn} ${ln}`.trim() || current?.name || ""
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({
      message: "บันทึกสำเร็จ",
      user: {
        id: user.id, name: user.name, email: user.email,
        firstName: user.firstName, lastName: user.lastName,
        rank: user.rank, address: user.address,
        maritalStatus: user.maritalStatus, education: user.education,
        nationalId: user.nationalId, civilianLicense: user.civilianLicense,
        armyLicense: user.armyLicense, photoUrl: user.photoUrl,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
