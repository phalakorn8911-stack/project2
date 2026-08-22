export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        vehicles: {
          include: { vehicle: { select: { registrationNumber: true, brand: true, model: true } } },
        },
      },
      orderBy: { rank: "asc" },
    })

    return NextResponse.json(
      drivers.map((d) => ({
        id: d.id,
        rank: d.rank,
        firstName: d.firstName,
        lastName: d.lastName,
        photoUrl: d.photoUrl,
        vehicles: d.vehicles.map((vd) => ({
          id: vd.vehicleId,
          registrationNumber: vd.vehicle.registrationNumber,
          brand: vd.vehicle.brand,
          model: vd.vehicle.model,
        })),
      }))
    )
  } catch (error) {
    console.error("Drivers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { rank, firstName, lastName, photoUrl } = await request.json()

    if (!rank || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const driver = await prisma.driver.create({
      data: { rank, firstName, lastName, photoUrl: photoUrl || null },
    })

    return NextResponse.json({
      id: driver.id,
      rank: driver.rank,
      firstName: driver.firstName,
      lastName: driver.lastName,
      photoUrl: driver.photoUrl,
    })
  } catch (error) {
    console.error("Create driver error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
