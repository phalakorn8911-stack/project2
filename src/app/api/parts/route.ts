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
        category: p.category.name,
        stock: p.stockQuantity,
        min: p.minimumQuantity,
        price: Number(p.unitPrice),
        vendor: p.vendor?.name ?? "-",
      }))
    )
  } catch (error) {
    console.error("Parts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
