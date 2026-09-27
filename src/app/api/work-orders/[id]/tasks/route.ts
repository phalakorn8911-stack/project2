export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

async function recalcLabor(workOrderId: string) {
  const agg = await prisma.workOrderTask.aggregate({
    where: { workOrderId },
    _sum: { cost: true },
  })
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { totalLaborCost: agg._sum.cost ?? 0 },
  })
  return agg._sum.cost ?? 0
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    const tasks = await prisma.workOrderTask.findMany({
      where: { workOrderId: id },
      orderBy: { id: "asc" },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("List tasks error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    const role = (session!.user as any).role
    if (role !== "mechanic" && role !== "admin") {
      return NextResponse.json({ error: "เฉพาะช่างซ่อมเท่านั้น" }, { status: 403 })
    }

    const wo = await prisma.workOrder.findUnique({ where: { id } })
    if (!wo) return NextResponse.json({ error: "ไม่พบใบงาน" }, { status: 404 })

    const { taskDescription, laborHours, cost } = await request.json()
    if (!taskDescription?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกรายละเอียดงาน" }, { status: 400 })
    }

    const task = await prisma.workOrderTask.create({
      data: {
        workOrderId: id,
        taskDescription: taskDescription.trim(),
        laborHours: Number(laborHours) || 0,
        cost: Number(cost) || 0,
      },
    })
    const totalLaborCost = await recalcLabor(id)

    return NextResponse.json({ ...task, totalLaborCost }, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
