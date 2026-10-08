export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Client } from "pg"
import { requireAuth, isMechanicLike } from "@/lib/api-auth"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  try {
    const { id } = await params
    const used = await prisma.workOrderPart.findMany({
      where: { workOrderId: id },
      include: { part: true },
      orderBy: { id: "asc" },
    })
    return NextResponse.json(
      used.map((u) => ({
        id: u.id,
        partId: u.partId,
        partNumber: u.part.partNumber,
        partName: u.part.name,
        unitMeasure: u.part.unitMeasure,
        quantity: u.quantity,
        unitPrice: u.unitPrice,
        totalPrice: u.totalPrice,
      }))
    )
  } catch (error) {
    console.error("List work order parts error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

// เบิกอะไหล่เข้าบิลงาน: ตัดสต็อก + ผูกใบงาน ใน transaction เดียว
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error
  const role = (session!.user as any).role
  if (!isMechanicLike(role)) {
    return NextResponse.json({ error: "เฉพาะช่างซ่อมเท่านั้น" }, { status: 403 })
  }

  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { id } = await params
    const { partId, quantity } = await request.json()
    const qty = Number(quantity) || 0
    if (!partId || qty <= 0) {
      return NextResponse.json({ error: "กรุณาเลือกอะไหล่และจำนวน" }, { status: 400 })
    }

    await pg.connect()
    await pg.query("BEGIN")
    try {
      const woRes = await pg.query(`SELECT id FROM "work_orders" WHERE id = $1`, [id])
      if (woRes.rowCount === 0) {
        await pg.query("ROLLBACK")
        return NextResponse.json({ error: "ไม่พบใบงาน" }, { status: 404 })
      }

      const partRes = await pg.query(`SELECT id, "stockQuantity", "unitPrice" FROM "parts" WHERE id = $1 FOR UPDATE`, [partId])
      if (partRes.rowCount === 0) {
        await pg.query("ROLLBACK")
        return NextResponse.json({ error: "ไม่พบอะไหล่" }, { status: 404 })
      }
      const part = partRes.rows[0]
      if (Number(part.stockQuantity) < qty) {
        await pg.query("ROLLBACK")
        return NextResponse.json({ error: `สต็อกไม่พอ (เหลือ ${part.stockQuantity})` }, { status: 409 })
      }

      const unitPrice = Number(part.unitPrice) || 0
      const totalPrice = unitPrice * qty
      const rowId = crypto.randomUUID()

      await pg.query(
        `INSERT INTO "work_order_parts" ("id", "workOrderId", "partId", "quantity", "unitPrice", "totalPrice")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rowId, id, partId, qty, unitPrice, totalPrice]
      )
      await pg.query(`UPDATE "parts" SET "stockQuantity" = "stockQuantity" - $1 WHERE id = $2`, [qty, partId])
      await pg.query(
        `INSERT INTO "stock_movements" ("id", "partId", "movementType", "quantity", "referenceId", "performedById")
         VALUES ($1, $2, 'OUT', $3, $4, $5)`,
        [crypto.randomUUID(), partId, qty, id, session!.user.id]
      )
      const totalRes = await pg.query(
        `UPDATE "work_orders" SET "totalPartsCost" = COALESCE((SELECT SUM("totalPrice") FROM "work_order_parts" WHERE "workOrderId" = $1), 0) WHERE id = $1 RETURNING "totalPartsCost"`,
        [id]
      )

      await pg.query("COMMIT")
      return NextResponse.json(
        { id: rowId, quantity: qty, unitPrice, totalPrice, totalPartsCost: Number(totalRes.rows[0].totalPartsCost) },
        { status: 201 }
      )
    } catch (txError) {
      await pg.query("ROLLBACK")
      throw txError
    }
  } catch (error: any) {
    console.error("Issue part error:", error)
    if (error?.code === "23505") {
      return NextResponse.json({ error: "เบิกอะไหล่นี้ไปแล้ว" }, { status: 409 })
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
