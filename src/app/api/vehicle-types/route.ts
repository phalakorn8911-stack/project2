export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const types = await prisma.vehicleType.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      types.map((t) => ({ id: t.id, name: t.name }))
    )
  } catch (error) {
    console.error("Vehicle types API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
