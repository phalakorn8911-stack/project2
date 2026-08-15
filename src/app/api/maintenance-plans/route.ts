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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
