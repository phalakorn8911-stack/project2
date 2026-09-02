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
      totalPartsCostAgg,
      availableVehicles,
      inRepairVehicles,
      waitingPartsVehicles,
      dueSoonVehicles,
      overdueVehicles,
      activeTrips,
      activeTripVehicles,
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
      }),
      prisma.vehicle.findMany({
        where: { status: "IN_REPAIR" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
      }),
      prisma.vehicle.findMany({
        where: { status: "WAITING_PARTS" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
      }),
      prisma.vehicle.findMany({
        where: { status: "DUE_SOON" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
      }),
      prisma.vehicle.findMany({
        where: { status: "OVERDUE" },
        include: { vehicleType: true },
        orderBy: { registrationNumber: "asc" },
      }),
      prisma.$queryRaw<{id: string; vehicleId: string; driverId: string; origin_tambon: string; origin_amphoe: string; origin_province: string; dest_tambon: string; dest_amphoe: string; dest_province: string; purpose: string; started_at: Date; first_name: string; last_name: string; rank: string; registrationNumber: string; brand: string; model: string}[]>`
        SELECT vt.*, d.first_name, d.last_name, d.rank, v."registrationNumber", v.brand, v.model
        FROM vehicle_trips vt
        JOIN drivers d ON d.id = vt."driverId"
        JOIN vehicles v ON v.id = vt."vehicleId"
        WHERE vt.status = 'active'
        ORDER BY vt."started_at" DESC
      `.catch(() => []),
      prisma.$queryRaw<{vehicleId: string}[]>`
        SELECT DISTINCT "vehicleId" FROM vehicle_trips WHERE status = 'active'
      `.catch(() => []),
    ])

    const statusCounts: Record<string, number> = {}
    for (const s of vehiclesByStatus) statusCounts[s.status] = s._count
    const woCounts: Record<string, number> = {}
    for (const w of workOrdersByStatus) woCounts[w.status] = w._count

    const totalPartsCostVal = Number(totalPartsCostAgg._sum.totalPartsCost ?? 0)

    return NextResponse.json({
      vehicles: {
        total: totalVehicles,
        available: statusCounts["AVAILABLE"] ?? 0,
        inRepair: statusCounts["IN_REPAIR"] ?? 0,
        waitingParts: statusCounts["WAITING_PARTS"] ?? 0,
        dueSoon: statusCounts["DUE_SOON"] ?? 0,
        overdue: statusCounts["OVERDUE"] ?? 0,
        inUse: activeTripVehicles.length,
        outOfService: statusCounts["OUT_OF_SERVICE"] ?? 0,
        retired: statusCounts["RETIRED"] ?? 0,
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
      totalPartsCost: totalPartsCostVal,
      activeTrips: activeTrips.map((t) => ({
        id: t.id,
        registrationNumber: t.registrationNumber,
        brand: t.brand,
        model: t.model,
        driverName: `${t.rank} ${t.first_name} ${t.last_name}`,
        origin: `${t.origin_tambon} ${t.origin_amphoe} ${t.origin_province}`,
        destination: `${t.dest_tambon} ${t.dest_amphoe} ${t.dest_province}`,
        purpose: t.purpose,
        startedAt: t.started_at,
      })),
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
        dueSoon: dueSoonVehicles.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          model: v.model,
          vehicleType: v.vehicleType.name,
          status: v.status,
        })),
        overdue: overdueVehicles.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          model: v.model,
          vehicleType: v.vehicleType.name,
          status: v.status,
        })),
      },
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
