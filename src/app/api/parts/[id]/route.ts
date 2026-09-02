export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.partNumber !== undefined) updateData.partNumber = body.partNumber
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.stockQuantity !== undefined) updateData.stockQuantity = body.stockQuantity
    if (body.minimumQuantity !== undefined) updateData.minimumQuantity = body.minimumQuantity
    if (body.unitMeasure !== undefined) updateData.unitMeasure = body.unitMeasure
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId || null

    const part = await prisma.part.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ id: part.id, name: part.name })
  } catch (error) {
    console.error("Update part error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    await prisma.stockMovement.deleteMany({ where: { partId: id } })
    await prisma.workOrderPart.deleteMany({ where: { partId: id } })
    await prisma.part.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Delete part error:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบรายการที่ต้องการลบ" }, { status: 404 })
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
