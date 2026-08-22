export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true, unit: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        rank: u.rank,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role.name,
        unit: u.unit?.name ?? "-",
        status: u.status,
      }))
    )
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
