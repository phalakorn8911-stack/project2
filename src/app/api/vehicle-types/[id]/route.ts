export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const type = await prisma.vehicleType.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json({ id: type.id, name: type.name })
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
