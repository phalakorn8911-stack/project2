export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id, taskId } = await params
    const role = (session!.user as any).role
    if (role !== "mechanic" && role !== "admin") {
      return NextResponse.json({ error: "เฉพาะช่างซ่อมเท่านั้น" }, { status: 403 })
    }

    const task = await prisma.workOrderTask.findFirst({ where: { id: taskId, workOrderId: id } })
    if (!task) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 })

    await prisma.workOrderTask.delete({ where: { id: taskId } })

    const agg = await prisma.workOrderTask.aggregate({
      where: { workOrderId: id },
      _sum: { cost: true },
    })
    await prisma.workOrder.update({
      where: { id },
      data: { totalLaborCost: agg._sum.cost ?? 0 },
    })

    return NextResponse.json({ ok: true, totalLaborCost: agg._sum.cost ?? 0 })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
