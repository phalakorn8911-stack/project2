export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    
    // GET /api/users?roles=true -> return roles only
    if (url.searchParams.get("roles") === "true") {
      const roles = await prisma.role.findMany({
        orderBy: { name: "asc" },
      })
      return NextResponse.json(roles.map((r) => ({ id: r.id, name: r.name, description: r.description })))
    }

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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Batch create: { items: [...users] }
    if (Array.isArray(body.items)) {
      const items = body.items.slice(0, 20)
      const results: any[] = []

      for (const item of items) {
        if (!item.email || !item.password || !item.name || !item.roleId) continue

        const existing = await prisma.user.findUnique({ where: { email: item.email } })
        if (existing) continue

        const hashedPassword = await bcrypt.hash(item.password, 10)
        const user = await prisma.user.create({
          data: {
            email: item.email,
            password: hashedPassword,
            name: item.name,
            rank: item.rank || null,
            firstName: item.firstName || null,
            lastName: item.lastName || null,
            roleId: item.roleId,
            unitId: item.unitId || null,
          },
        })
        results.push({ id: user.id, name: user.name, email: user.email })
      }

      return NextResponse.json({ created: results.length })
    }

    // Single create (legacy)
    const { email, password, name, rank, firstName, lastName, roleId, unitId } = body

    if (!email || !password || !name || !roleId) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธญเธตเน€เธกเธฅ, เธฃเธซเธฑเธชเธเนเธฒเธ, เธเธทเนเธญ, เนเธฅเธฐเธเธ—เธเธฒเธ—" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "เธญเธตเน€เธกเธฅเธเธตเนเธ–เธนเธเนเธเนเนเธฅเนเธง" }, { status: 400 })
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (role?.name === "admin") {
      const adminCount = await prisma.user.count({
        where: { role: { name: "admin" } },
      })
      if (adminCount >= 2) {
        return NextResponse.json({ error: "เธชเธฒเธกเธฒเธฃเธ–เน€เธเธดเนเธก admin เนเธ”เนเธชเธนเธเธชเธธเธ” 2 เธเธเน€เธ—เนเธฒเธเธฑเนเธ" }, { status: 400 })
      }
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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
