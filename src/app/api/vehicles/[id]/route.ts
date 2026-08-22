export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        unit: true,
        vehicleType: true,
        photos: {
          orderBy: { id: "desc" },
        },
        drivers: {
          include: { driver: true },
        },
        repairRequests: {
          include: { workOrder: true },
          orderBy: { requestNumber: "desc" },
          take: 10,
        },
        schedules: {
          include: { plan: true },
          orderBy: { nextDueDate: "asc" },
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      fleetNumber: vehicle.fleetNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType,
      currentMileage: vehicle.currentMileage,
      status: vehicle.status,
      unit: vehicle.unit.name,
      vehicleType: vehicle.vehicleType.name,
      vehicleTypeId: vehicle.vehicleTypeId,
      photos: vehicle.photos.map((p) => ({
        id: p.id,
        photoUrl: p.photoUrl,
        isPrimary: p.isPrimary,
      })),
      drivers: vehicle.drivers.map((vd) => ({
        id: vd.driver.id,
        rank: vd.driver.rank,
        firstName: vd.driver.firstName,
        lastName: vd.driver.lastName,
      })),
      repairRequests: vehicle.repairRequests.map((rr) => ({
        id: rr.id,
        requestNumber: rr.requestNumber,
        symptoms: rr.symptoms,
        systemCategory: rr.systemCategory,
        urgency: rr.urgency,
        status: rr.status,
        workOrder: rr.workOrder ? { woNumber: rr.workOrder.woNumber, status: rr.workOrder.status } : null,
      })),
      maintenanceSchedules: vehicle.schedules.map((ms) => ({
        id: ms.id,
        planName: ms.plan.name,
        lastPerformedDate: ms.lastPerformedDate?.toISOString() ?? null,
        nextDueDate: ms.nextDueDate?.toISOString() ?? null,
        status: ms.status,
      })),
    })
  } catch (error) {
    console.error("Vehicle detail API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(body.registrationNumber !== undefined && { registrationNumber: body.registrationNumber }),
        ...(body.model !== undefined && { model: body.model }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.currentMileage !== undefined && { currentMileage: body.currentMileage }),
        ...(body.vehicleTypeId !== undefined && { vehicleTypeId: body.vehicleTypeId }),
      },
    })

    return NextResponse.json({ ok: true, id: vehicle.id })
  } catch (error) {
    console.error("Update vehicle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
