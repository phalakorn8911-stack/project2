export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const types = await prisma.vehicleType.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      types.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        fuelType: t.fuelType,
        weight: t.weight,
        seatingCapacity: t.seatingCapacity,
        engineSpec: t.engineSpec,
      }))
    )
  } catch (error) {
    console.error("Vehicle types API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, fuelType, weight, seatingCapacity, engineSpec } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธเธฃเธฐเน€เธ เธ—เธฃเธ–" }, { status: 400 })
    }

    const type = await prisma.vehicleType.create({
      data: {
        name,
        ...(description !== undefined && { description }),
        ...(fuelType !== undefined && { fuelType }),
        ...(weight !== undefined && { weight }),
        ...(seatingCapacity !== undefined && { seatingCapacity }),
        ...(engineSpec !== undefined && { engineSpec }),
      },
    })

    return NextResponse.json({
      id: type.id,
      name: type.name,
      description: type.description,
      fuelType: type.fuelType,
      weight: type.weight,
      seatingCapacity: type.seatingCapacity,
      engineSpec: type.engineSpec,
    })
  } catch (error) {
    console.error("Create vehicle type error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
