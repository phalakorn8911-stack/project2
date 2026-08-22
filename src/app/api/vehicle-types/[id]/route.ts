export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const type = await prisma.vehicleType.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.fuelType !== undefined && { fuelType: body.fuelType }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.seatingCapacity !== undefined && { seatingCapacity: body.seatingCapacity }),
        ...(body.engineSpec !== undefined && { engineSpec: body.engineSpec }),
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
    console.error("Update vehicle type error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.vehicleType.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete vehicle type error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
