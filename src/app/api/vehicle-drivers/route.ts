export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { vehicleId, driverId } = await request.json()

    if (!vehicleId || !driverId) {
      return NextResponse.json({ error: "กรุณากรอกยานพาหนะ และพลขับ" }, { status: 400 })
    }

    const existing = await prisma.vehicleDriver.findUnique({
      where: { vehicleId_driverId: { vehicleId, driverId } },
    })

    if (existing) {
      return NextResponse.json({ error: "รถคันนี้มีพลขับคนนี้มอบหมายอยู่แล้ว" }, { status: 400 })
    }

    const vd = await prisma.vehicleDriver.create({
      data: { vehicleId, driverId },
    })

    return NextResponse.json({ id: vd.id, vehicleId: vd.vehicleId, driverId: vd.driverId })
  } catch (error) {
    console.error("Assign driver error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicleId")
    const driverId = searchParams.get("driverId")

    if (!vehicleId || !driverId) {
      return NextResponse.json({ error: "กรุณากรอกยานพาหนะ และพลขับ" }, { status: 400 })
    }

    await prisma.vehicleDriver.delete({
      where: { vehicleId_driverId: { vehicleId, driverId } },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Unassign driver error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
