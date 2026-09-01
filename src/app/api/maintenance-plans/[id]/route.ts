export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const plan = await prisma.maintenancePlan.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.vehicleTypeId !== undefined && { vehicleTypeId: body.vehicleTypeId }),
        ...(body.intervalMonths !== undefined && { intervalMonths: body.intervalMonths }),
        ...(body.intervalMileage !== undefined && { intervalMileage: body.intervalMileage }),
        ...(body.intervalHours !== undefined && { intervalHours: body.intervalHours }),
      },
    })

    return NextResponse.json({ id: plan.id, name: plan.name })
  } catch (error) {
    console.error("Update maintenance plan error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.maintenanceSchedule.deleteMany({ where: { planId: id } })
    await prisma.maintenancePlan.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Delete maintenance plan error:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบรายการที่ต้องการลบ" }, { status: 404 })
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
