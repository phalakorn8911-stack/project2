export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
        roleId: u.roleId,
        role: u.role.name,
        unitId: u.unitId,
        unit: u.unit?.name ?? "-",
        status: u.status,
      }))
    )
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, name, rank, firstName, lastName, roleId, unitId } = await request.json()

    if (!email || !password || !name || !roleId) {
      return NextResponse.json({ error: "Email, password, name, and role are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 400 })
    }

    const adminCount = await prisma.user.count({
      where: { role: { name: "admin" } },
    })
    if (adminCount >= 2) {
      return NextResponse.json({ error: "สามารถเพิ่ม admin ได้สูงสุด 2 คนเท่านั้น" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        rank: rank || null,
        firstName: firstName || null,
        lastName: lastName || null,
        roleId,
        unitId: unitId || null,
      },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
