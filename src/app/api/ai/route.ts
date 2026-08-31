export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function POST(request: Request) {
  try {
    const { question } = await request.json()
    const q = (question ?? "").toLowerCase()

    const pg = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
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

    await pg.end()

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
    return NextResponse.json({ reply: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" })
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

  if (q.includes("รถ") && (q.includes("กี่คัน") || q.includes("ทั้งหมด") || q.includes("จำนวน"))) {
    return `ขณะนี้มียานพาหนะทั้งหมด ${totalVehicles} คัน พร้อมใช้งาน ${available} คัน (${pct}%) กำลังซ่อม ${inRepair} คัน รออะไหล่ ${waitingParts} คัน เกินกำหนด ${overdue} คัน หยุดใช้งาน ${outOfService} คัน`
  }

  if (q.includes("แผนซ่อม") || q.includes("บำรุง") || q.includes("schedule")) {
    const parts: string[] = []
    if (ctx.overdueSchedules > 0) parts.push(`เกินกำหนด ${ctx.overdueSchedules} รายการ`)
    if (ctx.dueSoonSchedules > 0) parts.push(`ใกล้ถึงกำหนด ${ctx.dueSoonSchedules} รายการ`)
    return parts.length > 0
      ? `แผนซ่อมบำรุง: ${parts.join(" ")}`
      : "แผนซ่อมบำรุงอยู่ในเกณฑ์ปกติ ไม่มีรายการเกินกำหนด"
  }

  if (q.includes("แจ้งซ่อม") || q.includes("ค้าง")) {
    return `ใบแจ้งซ่อมค้างดำเนินการ ${ctx.pendingRepairs} รายการ`
  }

  if (q.includes("อะไหล่") || q.includes("สต็อก") || q.includes("stock")) {
    if (ctx.lowStockParts.length === 0) return "อะไหล่ทุกรายการมีสต็อกเพียงพอ"
    const list = ctx.lowStockParts
      .slice(0, 5)
      .map((p) => `${p.name} (เหลือ ${p.stockQuantity} / ขั้นต่ำ ${p.minimumQuantity})`)
      .join(", ")
    return `อะไหล่ใกล้หมด ${ctx.lowStockParts.length} รายการ: ${list}`
  }

  if (q.includes("ซ่อม") && (q.includes("กำลัง") || q.includes("ทำงาน") || progress(wc))) {
    const total = (wc["OPEN"] ?? 0) + (wc["IN_PROGRESS"] ?? 0) + (wc["WAITING_PARTS"] ?? 0)
    return `งานซ่อมที่กำลังดำเนินการ: รอรับงาน ${wc["OPEN"] ?? 0} กำลังซ่อม ${wc["IN_PROGRESS"] ?? 0} รออะไหล่ ${wc["WAITING_PARTS"] ?? 0} เสร็จแล้ว ${wc["COMPLETED"] ?? 0} รวม ${total} รายการ`
  }

  if (q.includes("พร้อม") || q.includes("available")) {
    return `รถพร้อมใช้งาน ${available} คัน จาก ${totalVehicles} คัน (${pct}%)`
  }

  if (q.includes("เกินกำหนด") || q.includes("overdue")) {
    return `รถเกินกำหนดซ่อม ${overdue} คัน หยุดใช้งาน ${outOfService} คัน ควรเร่งดำเนินการ`
  }

  return `ขณะนี้มียานพาหนะ ${totalVehicles} คัน พร้อมใช้งาน ${available} คัน กำลังซ่อม ${inRepair} คัน งานค้าง ${ctx.pendingRepairs} รายการ อะไหล่ใกล้หมด ${ctx.lowStockParts.length} รายการ สามารถถามเพิ่มเติมเกี่ยวกับ รถ, ซ่อม, อะไหล่, แผนซ่อมบำรุง ได้ครับ`
}

function progress(wc: Record<string, number>): boolean {
  return (wc["OPEN"] ?? 0) + (wc["IN_PROGRESS"] ?? 0) > 0
}
