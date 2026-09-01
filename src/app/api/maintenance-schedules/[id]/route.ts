export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id },
      include: {
        vehicle: true,
        plan: true,
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Get maintenance schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        ...(body.lastPerformedDate && { lastPerformedDate: new Date(body.lastPerformedDate) }),
        ...(body.lastPerformedMileage !== undefined && body.lastPerformedMileage !== null && { lastPerformedMileage: body.lastPerformedMileage }),
        ...(body.nextDueDate && { nextDueDate: new Date(body.nextDueDate) }),
        ...(body.nextDueMileage !== undefined && body.nextDueMileage !== null && { nextDueMileage: body.nextDueMileage }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        vehicle: true,
        plan: true,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Update maintenance schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
