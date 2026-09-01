export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { vehicles: true, users: true } } },
    })

    return NextResponse.json(
      units.map((u) => ({
        id: u.id,
        name: u.name,
        description: u.description,
        vehicleCount: u._count.vehicles,
        userCount: u._count.users,
      }))
    )
  } catch (error) {
    console.error("Units API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อหน่วยงาน" }, { status: 400 })
    }

    const unit = await prisma.unit.create({
      data: { name, description: description || null },
    })

    return NextResponse.json({ id: unit.id, name: unit.name, description: unit.description })
  } catch (error) {
    console.error("Create unit error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
