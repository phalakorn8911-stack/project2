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

    if (body.licensePlate !== undefined) { fields.push(`license_plate = $${idx++}`); values.push(body.licensePlate) }
    if (body.engineNumber !== undefined) { fields.push(`engine_number = $${idx++}`); values.push(body.engineNumber) }
    if (body.receivedDate !== undefined) { fields.push(`received_date = $${idx++}`); values.push(body.receivedDate) }
    if (body.receivedFrom !== undefined) { fields.push(`received_from = $${idx++}`); values.push(body.receivedFrom) }
    if (body.withdrawer !== undefined) { fields.push(`withdrawer = $${idx++}`); values.push(body.withdrawer) }
    if (body.engineCc !== undefined) { fields.push(`engine_cc = $${idx++}`); values.push(body.engineCc) }
    if (body.horsepower !== undefined) { fields.push(`horsepower = $${idx++}`); values.push(body.horsepower) }
    if (body.totalQuantity !== undefined) { fields.push(`total_quantity = $${idx++}`); values.push(body.totalQuantity) }
    if (body.maintenanceDetails !== undefined) { fields.push(`maintenance_details = $${idx++}`); values.push(body.maintenanceDetails) }

    fields.push(`updated_at = now()`)
    values.push(id)

    await pg.query(
      `UPDATE vehicle_histories SET ${fields.join(", ")} WHERE id = $${idx}`,
      values
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Update vehicle history error:", error)
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
    await pg.query("DELETE FROM vehicle_histories WHERE id = $1", [id])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete vehicle history error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
