export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      include: { category: true, vendor: true },
      orderBy: { partNumber: "asc" },
    })

    return NextResponse.json(
      parts.map((p) => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        categoryId: p.categoryId,
        category: p.category.name,
        stockQuantity: p.stockQuantity,
        minimumQuantity: p.minimumQuantity,
        unitMeasure: p.unitMeasure,
        unitPrice: Number(p.unitPrice),
        vendorId: p.vendorId,
        vendor: p.vendor?.name ?? "-",
      }))
    )
  } catch (error) {
    console.error("Parts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Batch create: { items: [...parts] }
    if (Array.isArray(body.items)) {
      const items = body.items.slice(0, 20)
      const created = await prisma.part.createMany({
        data: items.map((p: any) => ({
          name: p.name,
          partNumber: p.partNumber,
          categoryId: p.categoryId,
          stockQuantity: p.stockQuantity ?? 0,
          minimumQuantity: p.minimumQuantity ?? 0,
          unitMeasure: p.unitMeasure ?? "ชิ้น",
          unitPrice: p.unitPrice ?? 0,
          vendorId: p.vendorId || null,
        })),
        skipDuplicates: true,
      })
      return NextResponse.json({ created: created.count })
    }

    // Single create (legacy)
    const { name, partNumber, categoryId, stockQuantity, minimumQuantity, unitMeasure, unitPrice, vendorId } = body

    if (!name || !partNumber || !categoryId || !unitMeasure) {
      return NextResponse.json({ error: "กรุณากรอกชื่อ, หมายเลขอะไหล่, หมวดหมู่, และหน่วย" }, { status: 400 })
    }

    const part = await prisma.part.create({
      data: {
        name,
        partNumber,
        categoryId,
        stockQuantity: stockQuantity ?? 0,
        minimumQuantity: minimumQuantity ?? 0,
        unitMeasure,
        unitPrice: unitPrice ?? 0,
        vendorId: vendorId || null,
      },
    })

    return NextResponse.json({ id: part.id, name: part.name })
  } catch (error) {
    console.error("Create part error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
