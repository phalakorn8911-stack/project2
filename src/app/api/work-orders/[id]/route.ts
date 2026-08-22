export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === "COMPLETED") {
        updateData.endDate = new Date()
      } else if (body.status === "IN_PROGRESS" && !body.startDate) {
        updateData.startDate = new Date()
      }
    }
    if (body.mechanicId !== undefined) updateData.mechanicId = body.mechanicId

    const wo = await prisma.workOrder.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ id: wo.id, status: wo.status })
  } catch (error) {
    console.error("Update work order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
