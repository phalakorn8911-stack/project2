export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.part.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete part error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
