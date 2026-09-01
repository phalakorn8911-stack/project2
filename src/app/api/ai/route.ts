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
    return NextResponse.json({ reply: "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ" })
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

  if (q.includes("เธฃเธ–") && (q.includes("เธเธตเนเธเธฑเธ") || q.includes("เธ—เธฑเนเธเธซเธกเธ”") || q.includes("เธเธณเธเธงเธ"))) {
    return `เธเธ“เธฐเธเธตเนเธกเธตเธขเธฒเธเธเธฒเธซเธเธฐเธ—เธฑเนเธเธซเธกเธ” ${totalVehicles} เธเธฑเธ เธเธฃเนเธญเธกเนเธเนเธเธฒเธ ${available} เธเธฑเธ (${pct}%) เธเธณเธฅเธฑเธเธเนเธญเธก ${inRepair} เธเธฑเธ เธฃเธญเธญเธฐเนเธซเธฅเน ${waitingParts} เธเธฑเธ เน€เธเธดเธเธเธณเธซเธเธ” ${overdue} เธเธฑเธ เธซเธขเธธเธ”เนเธเนเธเธฒเธ ${outOfService} เธเธฑเธ`
  }

  if (q.includes("เนเธเธเธเนเธญเธก") || q.includes("เธเธณเธฃเธธเธ") || q.includes("schedule")) {
    const parts: string[] = []
    if (ctx.overdueSchedules > 0) parts.push(`เน€เธเธดเธเธเธณเธซเธเธ” ${ctx.overdueSchedules} เธฃเธฒเธขเธเธฒเธฃ`)
    if (ctx.dueSoonSchedules > 0) parts.push(`เนเธเธฅเนเธ–เธถเธเธเธณเธซเธเธ” ${ctx.dueSoonSchedules} เธฃเธฒเธขเธเธฒเธฃ`)
    return parts.length > 0
      ? `เนเธเธเธเนเธญเธกเธเธณเธฃเธธเธ: ${parts.join(" ")}`
      : "เนเธเธเธเนเธญเธกเธเธณเธฃเธธเธเธญเธขเธนเนเนเธเน€เธเธ“เธ‘เนเธเธเธ•เธด เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเน€เธเธดเธเธเธณเธซเธเธ”"
  }

  if (q.includes("เนเธเนเธเธเนเธญเธก") || q.includes("เธเนเธฒเธ")) {
    return `เนเธเนเธเนเธเธเนเธญเธกเธเนเธฒเธเธ”เธณเน€เธเธดเธเธเธฒเธฃ ${ctx.pendingRepairs} เธฃเธฒเธขเธเธฒเธฃ`
  }

  if (q.includes("เธญเธฐเนเธซเธฅเน") || q.includes("เธชเธ•เนเธญเธ") || q.includes("stock")) {
    if (ctx.lowStockParts.length === 0) return "เธญเธฐเนเธซเธฅเนเธ—เธธเธเธฃเธฒเธขเธเธฒเธฃเธกเธตเธชเธ•เนเธญเธเน€เธเธตเธขเธเธเธญ"
    const list = ctx.lowStockParts
      .slice(0, 5)
      .map((p) => `${p.name} (เน€เธซเธฅเธทเธญ ${p.stockQuantity} / เธเธฑเนเธเธ•เนเธณ ${p.minimumQuantity})`)
      .join(", ")
    return `เธญเธฐเนเธซเธฅเนเนเธเธฅเนเธซเธกเธ” ${ctx.lowStockParts.length} เธฃเธฒเธขเธเธฒเธฃ: ${list}`
  }

  if (q.includes("เธเนเธญเธก") && (q.includes("เธเธณเธฅเธฑเธ") || q.includes("เธ—เธณเธเธฒเธ") || progress(wc))) {
    const total = (wc["OPEN"] ?? 0) + (wc["IN_PROGRESS"] ?? 0) + (wc["WAITING_PARTS"] ?? 0)
    return `เธเธฒเธเธเนเธญเธกเธ—เธตเนเธเธณเธฅเธฑเธเธ”เธณเน€เธเธดเธเธเธฒเธฃ: เธฃเธญเธฃเธฑเธเธเธฒเธ ${wc["OPEN"] ?? 0} เธเธณเธฅเธฑเธเธเนเธญเธก ${wc["IN_PROGRESS"] ?? 0} เธฃเธญเธญเธฐเนเธซเธฅเน ${wc["WAITING_PARTS"] ?? 0} เน€เธชเธฃเนเธเนเธฅเนเธง ${wc["COMPLETED"] ?? 0} เธฃเธงเธก ${total} เธฃเธฒเธขเธเธฒเธฃ`
  }

  if (q.includes("เธเธฃเนเธญเธก") || q.includes("available")) {
    return `เธฃเธ–เธเธฃเนเธญเธกเนเธเนเธเธฒเธ ${available} เธเธฑเธ เธเธฒเธ ${totalVehicles} เธเธฑเธ (${pct}%)`
  }

  if (q.includes("เน€เธเธดเธเธเธณเธซเธเธ”") || q.includes("overdue")) {
    return `เธฃเธ–เน€เธเธดเธเธเธณเธซเธเธ”เธเนเธญเธก ${overdue} เธเธฑเธ เธซเธขเธธเธ”เนเธเนเธเธฒเธ ${outOfService} เธเธฑเธ เธเธงเธฃเน€เธฃเนเธเธ”เธณเน€เธเธดเธเธเธฒเธฃ`
  }

  return `เธเธ“เธฐเธเธตเนเธกเธตเธขเธฒเธเธเธฒเธซเธเธฐ ${totalVehicles} เธเธฑเธ เธเธฃเนเธญเธกเนเธเนเธเธฒเธ ${available} เธเธฑเธ เธเธณเธฅเธฑเธเธเนเธญเธก ${inRepair} เธเธฑเธ เธเธฒเธเธเนเธฒเธ ${ctx.pendingRepairs} เธฃเธฒเธขเธเธฒเธฃ เธญเธฐเนเธซเธฅเนเนเธเธฅเนเธซเธกเธ” ${ctx.lowStockParts.length} เธฃเธฒเธขเธเธฒเธฃ เธชเธฒเธกเธฒเธฃเธ–เธ–เธฒเธกเน€เธเธดเนเธกเน€เธ•เธดเธกเน€เธเธตเนเธขเธงเธเธฑเธ เธฃเธ–, เธเนเธญเธก, เธญเธฐเนเธซเธฅเน, เนเธเธเธเนเธญเธกเธเธณเธฃเธธเธ เนเธ”เนเธเธฃเธฑเธ`
}

function progress(wc: Record<string, number>): boolean {
  return (wc["OPEN"] ?? 0) + (wc["IN_PROGRESS"] ?? 0) > 0
}
