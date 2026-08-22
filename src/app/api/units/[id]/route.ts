export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
      },
    })

    return NextResponse.json({ id: unit.id, name: unit.name, description: unit.description })
  } catch (error) {
    console.error("Update unit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.unit.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete unit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
