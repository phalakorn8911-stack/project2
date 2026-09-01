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
    const { adjustment, reason, performedById } = await request.json()

    if (adjustment === undefined || typeof adjustment !== "number") {
      return NextResponse.json({ error: "กรุณาระบุจำนวนที่ต้องการปรับ" }, { status: 400 })
    }

    await pg.connect()

    const current = await pg.query(`SELECT "stockQuantity" FROM parts WHERE id = $1`, [id])
    if (current.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบอะไหล่" }, { status: 404 })
    }

    const newQty = current.rows[0].stockQuantity + adjustment
    if (newQty < 0) {
      return NextResponse.json({ error: "สต็อกไม่สามารถติดลบได้" }, { status: 400 })
    }

    await pg.query(`UPDATE parts SET "stockQuantity" = $1 WHERE id = $2`, [newQty, id])

    const movementId = crypto.randomUUID()
    await pg.query(
      `INSERT INTO "stock_movements" ("id", "partId", "movementType", "quantity", "referenceId", "performedById")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        movementId,
        id,
        adjustment > 0 ? "IN" : "OUT",
        Math.abs(adjustment),
        null,
        performedById || null,
      ]
    )

    return NextResponse.json({ ok: true, stockQuantity: newQty, adjustment })
  } catch (error) {
    console.error("Stock adjust error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
