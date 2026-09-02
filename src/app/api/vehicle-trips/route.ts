export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET(request: Request) {
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const driverId = searchParams.get("driverId")
    await pg.connect()
    let query = `
      SELECT vt.*, d.first_name, d.last_name, d.rank, v."registrationNumber", v.brand, v.model
      FROM vehicle_trips vt
      JOIN drivers d ON d.id = vt."driverId"
      JOIN vehicles v ON v.id = vt."vehicleId"
      WHERE 1=1
    `
    const params: any[] = []; let idx = 1
    if (status) { query += ` AND vt.status = $${idx++}`; params.push(status) }
    if (driverId) { query += ` AND vt."driverId" = $${idx++}`; params.push(driverId) }
    query += ` ORDER BY vt."started_at" DESC`
    const result = await pg.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Vehicle trips API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}

export async function POST(request: Request) {
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const body = await request.json()
    const { driverId, vehicleId, originTambon, originAmphoe, originProvince, destTambon, destAmphoe, destProvince, purpose } = body
    if (!driverId || !vehicleId) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    await pg.connect()
    const id = crypto.randomUUID()
    await pg.query(
      `INSERT INTO vehicle_trips (id, "driverId", "vehicleId", origin_tambon, origin_amphoe, origin_province, dest_tambon, dest_amphoe, dest_province, purpose)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, driverId, vehicleId, originTambon || "", originAmphoe || "", originProvince || "", destTambon || "", destAmphoe || "", destProvince || "", purpose || ""]
    )
    return NextResponse.json({ id, message: "บันทึกสำเร็จ" }, { status: 201 })
  } catch (error) {
    console.error("Create trip error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}

export async function PATCH(request: Request) {
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const body = await request.json()
    const { id, status: newStatus } = body
    if (!id) return NextResponse.json({ error: "ไม่พบรหัส" }, { status: 400 })
    await pg.connect()
    if (newStatus === "completed") {
      await pg.query(`UPDATE vehicle_trips SET status = 'completed', "ended_at" = NOW(), "updatedAt" = NOW() WHERE id = $1`, [id])
    } else {
      await pg.query(`UPDATE vehicle_trips SET status = $2, "updatedAt" = NOW() WHERE id = $1`, [id, newStatus])
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Update trip error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}

export async function DELETE(request: Request) {
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ไม่พบรหัส" }, { status: 400 })
    await pg.connect()
    await pg.query(`DELETE FROM vehicle_trips WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete trip error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}
