export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { unit: true, vehicleType: true, photos: true },
      orderBy: { registrationNumber: "asc" },
    })

    return NextResponse.json(
      vehicles.map((v) => ({
        id: v.id,
        reg: v.registrationNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        type: v.vehicleType.name,
        unit: v.unit.name,
        status: v.status,
        mileage: v.currentMileage.toLocaleString(),
        thumbnail: v.photos.find((p) => p.isPrimary)?.photoUrl ?? v.photos[0]?.photoUrl ?? null,
      }))
    )
  } catch (error) {
    console.error("Vehicles API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
