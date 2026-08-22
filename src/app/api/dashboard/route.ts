export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      totalVehicles,
      vehiclesByStatus,
      workOrdersByStatus,
      pendingRepairRequests,
      lowStockParts,
      overdueSchedules,
      dueSoonSchedules,
      totalPartsCost,
      availableVehicles,
      inRepairVehicles,
      waitingPartsVehicles,
      dueSoonVehicles,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.groupBy({ by: ["status"], _count: true }),
      prisma.workOrder.groupBy({ by: ["status"], _count: true }),
      prisma.repairRequest.count({ where: { status: "PENDING" } }),
      prisma.$queryRaw<{id: string}[]>`SELECT "id" FROM "parts" WHERE "stockQuantity" <= "minimumQuantity"`.catch(() => []),
      prisma.maintenanceSchedule.count({ where: { status: "OVERDUE" } }),
      prisma.maintenanceSchedule.count({ where: { status: "DUE_SOON" } }),
      prisma.workOrder.aggregate({ _sum: { totalPartsCost: true }, where: { status: "COMPLETED", endDate: { not: null } } }),
      prisma.vehicle.findMany({
        where: { status: "AVAILABLE" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
        take: 20,
      }),
      prisma.vehicle.findMany({
        where: { status: "IN_REPAIR" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
        take: 20,
      }),
      prisma.vehicle.findMany({
        where: { status: "WAITING_PARTS" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
        take: 20,
      }),
      prisma.maintenanceSchedule.findMany({
        where: { status: { in: ["DUE_SOON", "OVERDUE"] } },
        include: { vehicle: true, plan: true },
        orderBy: { nextDueDate: "asc" },
        take: 20,
      }),
    ])

    const statusCounts: Record<string, number> = {}
    for (const s of vehiclesByStatus) statusCounts[s.status] = s._count
    const woCounts: Record<string, number> = {}
    for (const w of workOrdersByStatus) woCounts[w.status] = w._count

    const monthlyCost = Number(totalPartsCost._sum.totalPartsCost ?? 0)

    return NextResponse.json({
      vehicles: {
        total: totalVehicles,
        available: statusCounts["AVAILABLE"] ?? 0,
        inRepair: statusCounts["IN_REPAIR"] ?? 0,
        waitingParts: statusCounts["WAITING_PARTS"] ?? 0,
        dueSoon: statusCounts["DUE_SOON"] ?? 0,
        overdue: statusCounts["OVERDUE"] ?? 0,
      },
      workOrders: {
        open: woCounts["OPEN"] ?? 0,
        inProgress: woCounts["IN_PROGRESS"] ?? 0,
        waitingParts: woCounts["WAITING_PARTS"] ?? 0,
        completed: woCounts["COMPLETED"] ?? 0,
      },
      pendingRepairs: pendingRepairRequests,
      overdueSchedules,
      dueSoonSchedules,
      lowStockCount: lowStockParts.length,
      monthlyCost,
      vehicleLists: {
        available: availableVehicles.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          model: v.model,
          vehicleType: v.vehicleType.name,
          status: v.status,
        })),
        inRepair: inRepairVehicles.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          model: v.model,
          vehicleType: v.vehicleType.name,
          status: v.status,
        })),
        waitingParts: waitingPartsVehicles.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          model: v.model,
          vehicleType: v.vehicleType.name,
          status: v.status,
        })),
        dueSoon: dueSoonVehicles.map((s) => ({
          id: s.vehicle.id,
          registrationNumber: s.vehicle.registrationNumber,
          model: s.vehicle.model,
          planName: s.plan.name,
          nextDueDate: s.nextDueDate?.toLocaleDateString("th-TH") ?? "-",
          status: s.status,
        })),
      },
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
