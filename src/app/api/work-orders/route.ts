export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Client } from "pg"

export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        vehicle: true,
        mechanic: true,
        repairRequest: true,
      },
      orderBy: { woNumber: "desc" },
    })

    return NextResponse.json(
      workOrders.map((wo) => ({
        id: wo.id,
        woNumber: wo.woNumber,
        vehicleId: wo.vehicleId,
        vehicleRegistration: wo.vehicle.registrationNumber,
        issueDescription: wo.repairRequest?.symptoms ?? "ไม่ระบุอาการ",
        urgency: wo.repairRequest?.urgency ?? "MEDIUM",
        mechanicName: wo.mechanic?.name ?? "-",
        status: wo.status,
      }))
    )
  } catch (error) {
    console.error("Work Orders API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { vehicleId, supervisorId, repairRequestId, mechanicId, issueDescription } = await request.json()

    if (!vehicleId || !supervisorId) {
      return NextResponse.json({ error: "กรุณากรอก UUID ยานพาหนะ, UUID พลขับ" }, { status: 400 })
    }

    await pg.connect()

    const countResult = await pg.query(`SELECT COUNT(*)::int as cnt FROM "work_orders"`)
    const nextNum = countResult.rows[0].cnt + 1
    const year = new Date().getFullYear()
    const woNumber = `WO-${year}-${String(nextNum).padStart(3, "0")}`

    const id = crypto.randomUUID()
    const result = await pg.query(
      `INSERT INTO "work_orders" ("id", "woNumber", "vehicleId", "supervisorId", "repairRequestId", "mechanicId", "status")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING "id", "woNumber"`,
      [id, woNumber, vehicleId, supervisorId, repairRequestId || null, mechanicId || null, "OPEN"]
    )

    if (repairRequestId) {
      await pg.query(`UPDATE "repair_requests" SET "status" = 'WORK_ORDER_CREATED' WHERE id = $1`, [repairRequestId])
    }

    return NextResponse.json({ id: result.rows[0].id, woNumber: result.rows[0].woNumber, message: "สร้างใบสั่งซ่อมสำเร็จ" }, { status: 201 })
  } catch (error: any) {
    console.error("Create work order error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
