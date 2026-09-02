export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    await pg.connect()

    let query = `
      SELECT dr.*, v."registrationNumber", v.model
      FROM driver_reports dr
      JOIN vehicles v ON v.id = dr."vehicleId"
    `
    const params: any[] = []
    if (driverId) {
      query += ` WHERE dr."driverId" = $1`
      params.push(driverId)
    }
    query += ` ORDER BY dr."reportDate" DESC`

    const result = await pg.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Driver reports API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}

export async function POST(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { driverId, vehicleId, symptoms, reportDate } = await request.json()

    if (!driverId || !vehicleId || !symptoms?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    await pg.connect()

    const id = crypto.randomUUID()
    const result = await pg.query(
      `INSERT INTO driver_reports (id, "driverId", "vehicleId", symptoms, "reportDate")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [id, driverId, vehicleId, symptoms.trim(), reportDate || new Date()]
    )

    return NextResponse.json({ id: result.rows[0].id, message: "บันทึกรายงานสำเร็จ" }, { status: 201 })
  } catch (error) {
    console.error("Create driver report error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
