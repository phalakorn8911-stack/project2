export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { id } = await params
    const body = await request.json()

    await pg.connect()

    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (body.symptoms !== undefined) {
      fields.push(`symptoms = $${idx++}`)
      values.push(body.symptoms)
    }
    if (body.reportDate !== undefined) {
      fields.push(`"reportDate" = $${idx++}`)
      values.push(body.reportDate)
    }
    if (body.vehicleId !== undefined) {
      fields.push(`"vehicleId" = $${idx++}`)
      values.push(body.vehicleId)
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่ต้องแก้ไข" }, { status: 400 })
    }

    fields.push(`"updatedAt" = NOW()`)
    values.push(id)

    await pg.query(`UPDATE driver_reports SET ${fields.join(", ")} WHERE id = $${idx}`, values)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Update driver report error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { id } = await params
    await pg.connect()
    await pg.query(`DELETE FROM driver_reports WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete driver report error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
