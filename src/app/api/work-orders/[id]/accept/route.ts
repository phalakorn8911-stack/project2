export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isMechanicLike } from "@/lib/api-auth"

// ช่างกดรับงาน: ผูกงานให้ตัวเอง + เริ่มสถานะ IN_PROGRESS
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    const role = (session!.user as any).role
    if (!isMechanicLike(role)) {
      return NextResponse.json({ error: "เฉพาะช่างซ่อมเท่านั้น" }, { status: 403 })
    }

    const wo = await prisma.workOrder.findUnique({ where: { id } })
    if (!wo) return NextResponse.json({ error: "ไม่พบใบงาน" }, { status: 404 })
    if (!["OPEN", "ASSIGNED", "PENDING_APPROVAL"].includes(wo.status)) {
      return NextResponse.json({ error: "งานนี้รับไปแล้วหรือดำเนินการอยู่" }, { status: 409 })
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        mechanicId: session!.user.id,
        status: "IN_PROGRESS",
        startDate: wo.startDate ?? new Date(),
      },
    })

    return NextResponse.json({ id: updated.id, status: updated.status, mechanicId: updated.mechanicId })
  } catch (error) {
    console.error("Accept work order error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
