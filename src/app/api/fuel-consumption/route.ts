export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"
import { requireAuth } from "@/lib/api-auth"

export async function GET(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicleId")
    await pg.connect()
    let query = `
      SELECT fc.*, v."registrationNumber", v.brand, v.model
      FROM fuel_consumption fc
      JOIN vehicles v ON v.id = fc."vehicleId"
    `
    const params: any[] = []
    if (vehicleId) { query += ` WHERE fc."vehicleId" = $1`; params.push(vehicleId) }
    query += ` ORDER BY fc."recordedAt" DESC`
    const result = await pg.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Fuel consumption API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const { vehicleId, fuelRate, fuelType, liters, costPerLiter, notes, recordedAt } = await request.json()
    if (!vehicleId || !fuelRate) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }
    await pg.connect()
    const id = crypto.randomUUID()
    const totalCost = (liters || 0) * (costPerLiter || 0)
    await pg.query(
      `INSERT INTO fuel_consumption (id, "vehicleId", "fuelRate", "fuelType", "liters", "costPerLiter", "totalCost", "notes", "recordedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, vehicleId, fuelRate, fuelType || "Diesel", liters || 0, costPerLiter || 0, totalCost, notes || "", recordedAt || new Date()]
    )
    return NextResponse.json({ id, message: "บันทึกสำเร็จ" }, { status: 201 })
  } catch (error) {
    console.error("Create fuel record error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ไม่พบรหัส" }, { status: 400 })
    await pg.connect()
    await pg.query(`DELETE FROM fuel_consumption WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete fuel record error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally { await pg.end() }
}
