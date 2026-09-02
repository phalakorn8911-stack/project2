export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Client } from "pg"
import { requireAuth } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error
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
        symptoms: (wo as any).symptoms ?? "",
        diagnosis: (wo as any).diagnosis ?? "",
        urgency: wo.repairRequest?.urgency ?? "MEDIUM",
        mechanicName: wo.mechanic?.name ?? "-",
        mechanicPhotoUrl: wo.mechanic?.photoUrl ?? null,
        status: wo.status,
      }))
    )
  } catch (error) {
    console.error("Work Orders API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { vehicleId, supervisorId, repairRequestId, mechanicId, issueDescription, symptoms } = await request.json()

    if (!vehicleId || !supervisorId) {
      return NextResponse.json({ error: "กรุณากรอกยานพาหนะ, ผู้ควบคุม" }, { status: 400 })
    }

    await pg.connect()

    const year = new Date().getFullYear()
    const suffix = crypto.randomUUID().slice(0, 4).toUpperCase()
    const woNumber = `WO-${year}-${suffix}`

    const id = crypto.randomUUID()
    const result = await pg.query(
      `INSERT INTO "work_orders" ("id", "woNumber", "vehicleId", "supervisorId", "repairRequestId", "mechanicId", "status", "symptoms")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING "id", "woNumber"`,
      [id, woNumber, vehicleId, supervisorId, repairRequestId || null, mechanicId || null, "OPEN", symptoms || ""]
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
