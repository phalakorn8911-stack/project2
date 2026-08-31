export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { adjustment, reason, performedBy } = await request.json()

    if (adjustment === undefined || typeof adjustment !== "number") {
      return NextResponse.json({ error: "Adjustment value is required" }, { status: 400 })
    }

    const pg = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    await pg.connect()

    const current = await pg.query(`SELECT "stockQuantity" FROM parts WHERE id = $1`, [id])
    if (current.rows.length === 0) {
      await pg.end()
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    const newQty = current.rows[0].stockQuantity + adjustment
    if (newQty < 0) {
      await pg.end()
      return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 })
    }

    await pg.query(`UPDATE parts SET "stockQuantity" = $1 WHERE id = $2`, [newQty, id])

    const movementId = crypto.randomUUID()
    await pg.query(
      `INSERT INTO "stock_movements" ("id", "partId", "movementType", "quantity", "referenceId", "notes")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        movementId,
        id,
        adjustment > 0 ? "RECEIVED" : "CONSUMED",
        Math.abs(adjustment),
        null,
        reason || null,
      ]
    )

    await pg.end()

    return NextResponse.json({ ok: true, stockQuantity: newQty, adjustment })
  } catch (error) {
    console.error("Stock adjust error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
