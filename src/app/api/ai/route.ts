export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function POST(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { question } = await request.json()
    const q = (question ?? "").toLowerCase()

    await pg.connect()

    const [
      totalResult,
      vehicleStatusResult,
      workOrderStatusResult,
      pendingRepairsResult,
      lowStockResult,
      overdueResult,
      dueSoonResult,
    ] = await Promise.all([
      pg.query(`SELECT COUNT(*)::int AS cnt FROM "vehicles"`),
      pg.query(`SELECT "status", COUNT(*)::int AS cnt FROM "vehicles" GROUP BY "status"`),
      pg.query(`SELECT "status", COUNT(*)::int AS cnt FROM "work_orders" GROUP BY "status"`),
      pg.query(`SELECT COUNT(*)::int AS cnt FROM "repair_requests" WHERE "status" = 'PENDING'`),
      pg.query(`SELECT "name", "stockQuantity", "minimumQuantity" FROM "parts" WHERE "stockQuantity" <= "minimumQuantity" ORDER BY "stockQuantity" ASC LIMIT 10`),
      pg.query(`SELECT COUNT(*)::int AS cnt FROM "maintenance_schedules" WHERE "status" = 'OVERDUE'`),
      pg.query(`SELECT COUNT(*)::int AS cnt FROM "maintenance_schedules" WHERE "status" = 'DUE_SOON'`),
    ])

    const totalVehicles = totalResult.rows[0].cnt

    const sc: Record<string, number> = {}
    for (const r of vehicleStatusResult.rows) sc[r.status] = r.cnt

    const wc: Record<string, number> = {}
    for (const r of workOrderStatusResult.rows) wc[r.status] = r.cnt

    const pendingRepairs = pendingRepairsResult.rows[0].cnt
    const lowStockParts = lowStockResult.rows.map((r) => ({
      name: r.name,
      stockQuantity: r.stockQuantity,
      minimumQuantity: r.minimumQuantity,
    }))
    const overdueSchedules = overdueResult.rows[0].cnt
    const dueSoonSchedules = dueSoonResult.rows[0].cnt

    const reply = buildReply(q, {
      totalVehicles,
      sc,
      wc,
      pendingRepairs,
      lowStockParts,
      overdueSchedules,
      dueSoonSchedules,
    })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json({ reply: "ขออภัย ฉันไม่เข้าใจคำถามของคุณ กรุณาลองใหม่อีกครั้ง" })
  } finally {
    await pg.end()
  }
}

type Ctx = {
  totalVehicles: number
  sc: Record<string, number>
  wc: Record<string, number>
  pendingRepairs: number
  lowStockParts: { name: string; stockQuantity: number; minimumQuantity: number }[]
  overdueSchedules: number
  dueSoonSchedules: number
}

function buildReply(q: string, ctx: Ctx): string {
  const { sc, wc, totalVehicles } = ctx
  const available = sc["AVAILABLE"] ?? 0
  const inRepair = sc["IN_REPAIR"] ?? 0
  const waitingParts = sc["WAITING_PARTS"] ?? 0
  const overdue = sc["OVERDUE"] ?? 0
  const outOfService = sc["OUT_OF_SERVICE"] ?? 0
  const pct = totalVehicles > 0 ? ((available / totalVehicles) * 100).toFixed(1) : "0"

  if (q.includes("สรุป") && (q.includes("สถานะรถ") || q.includes("ยานพาหนะ") || q.includes("ทั้งหมด"))) {
    return `สรุปข้อมูลยานพาหนะทั้งหมด ${totalVehicles} คัน พร้อมใช้งาน ${available} คัน (${pct}%) อยู่ระหว่างซ่อม ${inRepair} คัน รอชิ้นส่วน ${waitingParts} คัน เกินกำหนด ${overdue} คัน หยุดให้บริการ ${outOfService} คัน`
  }

  if (q.includes("กำหนดการ") || q.includes("ตาราง") || q.includes("schedule")) {
    const parts: string[] = []
    if (ctx.overdueSchedules > 0) parts.push(`เกินกำหนด ${ctx.overdueSchedules} รายการ`)
    if (ctx.dueSoonSchedules > 0) parts.push(`ใกล้ถึงกำหนด ${ctx.dueSoonSchedules} รายการ`)
    return parts.length > 0
      ? `กำหนดการบำรุงรักษา: ${parts.join(" ")}`
      : "กำหนดการบำรุงรักษาทั้งหมดอยู่ในเกณฑ์ปกติ ไม่มีรายการเกินกำหนด"
  }

  if (q.includes("รายการซ่อม") || q.includes("ซ่อมแซม")) {
    return `รายการซ่อมแซมที่รอดำเนินการ ${ctx.pendingRepairs} รายการ`
  }

  if (q.includes("ชิ้นส่วน") || q.includes("อะไหล่") || q.includes("stock")) {
    if (ctx.lowStockParts.length === 0) return "ชิ้นส่วนทั้งหมดมีเพียงพอไม่ต้องสั่งซื้อเพิ่ม"
    const list = ctx.lowStockParts
      .slice(0, 5)
      .map((p) => `${p.name} (คงเหลือ ${p.stockQuantity} / ขั้นต่ำ ${p.minimumQuantity})`)
      .join(", ")
    return `ชิ้นส่วนใกล้หมด ${ctx.lowStockParts.length} รายการ: ${list}`
  }

  if (q.includes("งาน") && (q.includes("ดำเนินการ") || q.includes("ความคืบหน้า") || progress(wc))) {
    const total = (wc["OPEN"] ?? 0) + (wc["IN_PROGRESS"] ?? 0) + (wc["WAITING_PARTS"] ?? 0)
    return `ใบสั่งซ่อมอยู่ระหว่างดำเนินการ: เปิดใหม่ ${wc["OPEN"] ?? 0} ดำเนินการ ${wc["IN_PROGRESS"] ?? 0} รอชิ้นส่วน ${wc["WAITING_PARTS"] ?? 0} เสร็จสิ้น ${wc["COMPLETED"] ?? 0} ทั้งหมด ${total} รายการ`
  }

  if (q.includes("พร้อมใช้งาน") || q.includes("available")) {
    return `ขณะนี้พร้อมใช้งาน ${available} คัน จาก ${totalVehicles} คัน (${pct}%)`
  }

  if (q.includes("เกินกำหนด") || q.includes("overdue")) {
    return `ขณะนี้เกินกำหนด ${overdue} คัน หยุดให้บริการ ${outOfService} คัน กรุณาดำเนินการโดยด่วน`
  }

  return `สรุปข้อมูลยานพาหนะ ${totalVehicles} คัน พร้อมใช้งาน ${available} คัน อยู่ระหว่างซ่อม ${inRepair} คัน ซ่อมแซมที่รอดำเนินการ ${ctx.pendingRepairs} รายการ ชิ้นส่วนใกล้หมด ${ctx.lowStockParts.length} รายการ คุณสามารถสอบถามเกี่ยวกับ ยานพาหนะ, งาน, ชิ้นส่วน, กำหนดการบำรุงรักษา ได้`
}

function progress(wc: Record<string, number>): boolean {
  return (wc["OPEN"] ?? 0) + (wc["IN_PROGRESS"] ?? 0) > 0
}
