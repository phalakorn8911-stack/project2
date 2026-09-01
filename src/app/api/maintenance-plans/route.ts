export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const plans = await prisma.maintenancePlan.findMany({
      include: { vehicleType: true, schedules: { include: { vehicle: true } } },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        vehicleType: p.vehicleType.name,
        vehicleTypeId: p.vehicleTypeId,
        intervalMonths: p.intervalMonths,
        intervalHours: p.intervalHours,
        intervalMileage: p.intervalMileage,
        totalVehicles: p.schedules.length,
        dueSoon: p.schedules.filter((s) => s.status === "DUE_SOON").length,
        overdue: p.schedules.filter((s) => s.status === "OVERDUE").length,
      }))
    )
  } catch (error) {
    console.error("Maintenance Plans API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, vehicleTypeId, intervalMonths, intervalMileage, intervalHours } = await request.json()

    if (!name || !vehicleTypeId) {
      return NextResponse.json({ error: "กรุณากรอกชื่อแผน และประเภทรถ" }, { status: 400 })
    }

    const plan = await prisma.maintenancePlan.create({
      data: {
        name,
        vehicleTypeId,
        ...(intervalMonths !== undefined && intervalMonths !== null && { intervalMonths }),
        ...(intervalMileage !== undefined && intervalMileage !== null && { intervalMileage }),
        ...(intervalHours !== undefined && intervalHours !== null && { intervalHours }),
      },
    })

    return NextResponse.json({ id: plan.id, name: plan.name })
  } catch (error) {
    console.error("Create maintenance plan error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
