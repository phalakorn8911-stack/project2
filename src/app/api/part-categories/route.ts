export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.partCategory.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธซเธกเธงเธ”เธซเธกเธนเน" }, { status: 400 })
    }
    const category = await prisma.partCategory.create({ data: { name: name.trim() } })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
