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
        code: p.partNumber,
        categoryId: p.categoryId,
        category: p.category.name,
        stock: p.stockQuantity,
        min: p.minimumQuantity,
        unit: p.unitMeasure,
        price: Number(p.unitPrice),
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
    const { name, partNumber, categoryId, stockQuantity, minimumQuantity, unitMeasure, unitPrice, vendorId } = await request.json()

    if (!name || !partNumber || !categoryId || !unitMeasure) {
      return NextResponse.json({ error: "Name, part number, category, and unit are required" }, { status: 400 })
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
