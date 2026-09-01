export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET() {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    await pg.connect()
    const result = await pg.query(
      `SELECT rr.id, rr."requestNumber", rr."vehicleId", rr."requesterId", rr.symptoms,
              rr."systemCategory", rr.urgency, rr.mileage, rr.status, rr."photoUrl",
              v."registrationNumber" as "vehicleName"
       FROM "repair_requests" rr
       LEFT JOIN vehicles v ON v.id = rr."vehicleId"
       ORDER BY rr."requestNumber" DESC`
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Repair requests API error:", error)
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
    const body = await request.json()
    const { vehicleId, requesterId, symptoms, systemCategory, urgency, mileage, photoUrl } = body

    if (!vehicleId || !requesterId || !symptoms || !systemCategory) {
      return NextResponse.json({ error: "กรุณากรอก UUID ยานพาหนะ, อาการ, ประเภทระบบ, ความเร่งด่วน" }, { status: 400 })
    }

    await pg.connect()

    // สร้าง requestNumber แบบอัตโนมัติ
    const countResult = await pg.query(`SELECT COUNT(*)::int as cnt FROM "repair_requests"`)
    const nextNum = countResult.rows[0].cnt + 1
    const year = new Date().getFullYear()
    const requestNumber = `RR-${year}-${String(nextNum).padStart(3, "0")}`

    const id = crypto.randomUUID()
    const result = await pg.query(
      `INSERT INTO "repair_requests" ("id", "requestNumber", "vehicleId", "requesterId", "symptoms", "systemCategory", "urgency", "mileage", "status", "photoUrl")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING "id", "requestNumber"`,
      [id, requestNumber, vehicleId, requesterId, symptoms, systemCategory, urgency || "MEDIUM", mileage || 0, "PENDING", photoUrl || null]
    )

    return NextResponse.json({ id: result.rows[0].id, requestNumber: result.rows[0].requestNumber, message: "สร้างบันทึกซ่อมสำเร็จ" }, { status: 201 })
  } catch (error: any) {
    console.error("Repair request create error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
