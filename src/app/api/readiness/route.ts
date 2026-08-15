export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function calcReadiness(status: string, overdueCount: number, dueSoonCount: number, mileage: number): number {
  let base = 100

  switch (status) {
    case "AVAILABLE": base = 100; break
    case "IN_USE": base = 90; break
    case "DUE_SOON": base = 75; break
    case "OVERDUE": base = 50; break
    case "IN_REPAIR": base = 30; break
    case "WAITING_PARTS": base = 20; break
    case "OUT_OF_SERVICE": base = 0; break
    case "RETIRED": base = 0; break
    default: base = 60
  }

  if (overdueCount > 0) base -= overdueCount * 10
  if (dueSoonCount > 0) base -= dueSoonCount * 5
  if (mileage > 100000) base -= 5
  if (mileage > 80000) base -= 3

  return Math.max(0, Math.min(100, base))
}

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        unit: true,
        vehicleType: true,
        schedules: true,
      },
      orderBy: { registrationNumber: "asc" },
    })

    const result = vehicles.map((v) => {
      const overdueCount = v.schedules.filter((s) => s.status === "OVERDUE").length
      const dueSoonCount = v.schedules.filter((s) => s.status === "DUE_SOON").length
      const readiness = calcReadiness(v.status, overdueCount, dueSoonCount, v.currentMileage)

      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        brand: v.brand,
        model: v.model,
        unit: v.unit.name,
        vehicleType: v.vehicleType.name,
        status: v.status,
        readiness,
        overdueMaintenance: overdueCount,
        dueSoonMaintenance: dueSoonCount,
        mileage: v.currentMileage,
      }
    })

    const overallReadiness = result.length > 0
      ? Math.round(result.reduce((sum, v) => sum + v.readiness, 0) / result.length)
      : 0

    return NextResponse.json({
      overall: overallReadiness,
      vehicles: result,
      summary: {
        total: result.length,
        excellent: result.filter((v) => v.readiness >= 90).length,
        good: result.filter((v) => v.readiness >= 70 && v.readiness < 90).length,
        fair: result.filter((v) => v.readiness >= 50 && v.readiness < 70).length,
        poor: result.filter((v) => v.readiness < 50).length,
      },
    })
  } catch (error) {
    console.error("Readiness API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
