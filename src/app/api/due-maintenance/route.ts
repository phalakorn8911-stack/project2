export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { status: { in: ["OVERDUE", "DUE_SOON"] } },
      include: { vehicle: { include: { vehicleType: true } }, plan: true },
      orderBy: { nextDueDate: "asc" },
      take: 10,
    })

    const result = schedules.map((s) => ({
      vehicleId: s.vehicleId,
      vehicle: s.vehicle.registrationNumber,
      model: s.vehicle.model,
      type: s.plan.name,
      dueDate: s.nextDueDate?.toLocaleDateString("th-TH") ?? "-",
      status: s.status === "OVERDUE" ? "เกินกำหนด" : "ใกล้ถึงกำหนด",
      statusColor: s.status === "OVERDUE" ? "text-destructive bg-destructive/10" : "text-status-due bg-status-due/10",
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Due maintenance API error:", error)
    return NextResponse.json([])
  }
}
