export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const req = await prisma.repairRequest.findUnique({
      where: { id },
      include: {
        vehicle: true,
        requester: true,
        workOrder: true,
      },
    })

    if (!req) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 })
    }

    return NextResponse.json(req)
  } catch (error) {
    console.error("Get repair request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const req = await prisma.repairRequest.update({
      where: { id },
      data: {
        ...(body.symptoms !== undefined && { symptoms: body.symptoms }),
        ...(body.systemCategory !== undefined && { systemCategory: body.systemCategory }),
        ...(body.urgency !== undefined && { urgency: body.urgency }),
        ...(body.mileage !== undefined && { mileage: body.mileage }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
      },
      include: {
        vehicle: true,
        requester: true,
      },
    })

    return NextResponse.json(req)
  } catch (error) {
    console.error("Update repair request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.workOrder.updateMany({ where: { repairRequestId: id }, data: { repairRequestId: null } })
    await prisma.repairRequest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Delete repair request error:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบรายการที่ต้องการลบ" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
