export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        vehicle: true,
        mechanic: true,
        repairRequest: true,
      },
      orderBy: { woNumber: "desc" },
    })

    return NextResponse.json(
      workOrders.map((wo) => ({
        id: wo.id,
        woNumber: wo.woNumber,
        vehicleId: wo.vehicleId,
        vehicleRegistration: wo.vehicle.registrationNumber,
        issueDescription: wo.repairRequest?.symptoms ?? "ไม่ระบุ",
        urgency: wo.repairRequest?.urgency ?? "MEDIUM",
        mechanicName: wo.mechanic?.name ?? "-",
        status: wo.status,
      }))
    )
  } catch (error) {
    console.error("Work Orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
