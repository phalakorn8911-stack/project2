export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")

    const where = planId ? { planId } : {}

    const schedules = await prisma.maintenanceSchedule.findMany({
      where,
      include: {
        vehicle: { include: { vehicleType: true } },
        plan: true,
      },
      orderBy: { nextDueDate: "asc" },
    })

    return NextResponse.json(
      schedules.map((s) => ({
        id: s.id,
        vehicleId: s.vehicleId,
        registrationNumber: s.vehicle.registrationNumber,
        model: s.vehicle.model,
        vehicleType: s.vehicle.vehicleType.name,
        planId: s.planId,
        planName: s.plan.name,
        lastPerformedDate: s.lastPerformedDate?.toISOString() ?? null,
        lastPerformedMileage: s.lastPerformedMileage,
        nextDueDate: s.nextDueDate?.toISOString() ?? null,
        nextDueMileage: s.nextDueMileage,
        status: s.status,
      }))
    )
  } catch (error) {
    console.error("Maintenance schedules API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { planId, vehicleId, lastPerformedDate, lastPerformedMileage, nextDueDate, nextDueMileage } = await request.json()

    if (!planId || !vehicleId) {
      return NextResponse.json({ error: "กรุณากรอก UUID ประเภท, ชื่อ, วันที่เริ่ม, สิ้นสุด, สถานะ" }, { status: 400 })
    }

    const existing = await prisma.maintenanceSchedule.findFirst({
      where: { planId, vehicleId },
    })

    if (existing) {
      return NextResponse.json({ error: "UUID ประเภทหรือ UUID พลขับซ้ำ" }, { status: 400 })
    }

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        planId,
        vehicleId,
        ...(lastPerformedDate && { lastPerformedDate: new Date(lastPerformedDate) }),
        ...(lastPerformedMileage !== undefined && { lastPerformedMileage }),
        ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
        ...(nextDueMileage !== undefined && { nextDueMileage }),
      },
    })

    return NextResponse.json({ id: schedule.id })
  } catch (error) {
    console.error("Create maintenance schedule error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
