export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"
import { requireAuth } from "@/lib/api-auth"

// คืนอะไหล่ที่เบิก: ลบรายการ + คืนสต็อก ใน transaction เดียว
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  const role = (session!.user as any).role
  if (role !== "mechanic" && role !== "admin") {
    return NextResponse.json({ error: "เฉพาะช่างซ่อมเท่านั้น" }, { status: 403 })
  }

  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { id, rowId } = await params
    await pg.connect()
    await pg.query("BEGIN")
    try {
      const rowRes = await pg.query(`SELECT "partId", "quantity" FROM "work_order_parts" WHERE id = $1 AND "workOrderId" = $2`, [rowId, id])
      if (rowRes.rowCount === 0) {
        await pg.query("ROLLBACK")
        return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 })
      }
      const { partId, quantity } = rowRes.rows[0]

      await pg.query(`DELETE FROM "work_order_parts" WHERE id = $1`, [rowId])
      await pg.query(`UPDATE "parts" SET "stockQuantity" = "stockQuantity" + $1 WHERE id = $2`, [quantity, partId])
      await pg.query(
        `INSERT INTO "stock_movements" ("id", "partId", "movementType", "quantity", "referenceId", "performedById")
         VALUES ($1, $2, 'IN', $3, $4, $5)`,
        [crypto.randomUUID(), partId, quantity, id, session!.user.id]
      )
      const totalRes = await pg.query(
        `UPDATE "work_orders" SET "totalPartsCost" = COALESCE((SELECT SUM("totalPrice") FROM "work_order_parts" WHERE "workOrderId" = $1), 0) WHERE id = $1 RETURNING "totalPartsCost"`,
        [id]
      )

      await pg.query("COMMIT")
      return NextResponse.json({ ok: true, totalPartsCost: Number(totalRes.rows[0].totalPartsCost) })
    } catch (txError) {
      await pg.query("ROLLBACK")
      throw txError
    }
  } catch (error) {
    console.error("Return part error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
