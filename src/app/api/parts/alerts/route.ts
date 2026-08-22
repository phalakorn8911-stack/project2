export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      include: { category: true },
      orderBy: { partNumber: "asc" },
    })

    const lowStock = parts.filter((p) => p.stockQuantity <= p.minimumQuantity)
    const outOfStock = parts.filter((p) => p.stockQuantity === 0)

    return NextResponse.json({
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        category: p.category.name,
        stockQuantity: p.stockQuantity,
        minimumQuantity: p.minimumQuantity,
        unitMeasure: p.unitMeasure,
        status: p.stockQuantity === 0 ? "out_of_stock" : "low_stock",
      })),
      outOfStock: outOfStock.map((p) => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        category: p.category.name,
        unitMeasure: p.unitMeasure,
      })),
      summary: {
        totalParts: parts.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
    })
  } catch (error) {
    console.error("Parts alerts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
