export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    const { rank, firstName, lastName } = await request.json()

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(rank !== undefined && { rank }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
    })

    return NextResponse.json({
      id: driver.id,
      rank: driver.rank,
      firstName: driver.firstName,
      lastName: driver.lastName,
    })
  } catch (error) {
    console.error("Update driver error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params

    await prisma.vehicleDriver.deleteMany({ where: { driverId: id } })
    await prisma.driver.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete driver error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
