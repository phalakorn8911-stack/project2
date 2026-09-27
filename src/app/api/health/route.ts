export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"
import { missingEnv } from "@/lib/env"

// Health check สาธารณะ (ไม่คืนความลับ) — ต่อ cron/monitor ไว้กัน project หลับและรู้ตัวก่อนล่ม
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}
  const withTimeout = async <T>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>
    try {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms)
        }),
      ])
    } finally {
      clearTimeout(timer!)
    }
  }

  // 1. env ครบไหม
  const missing = missingEnv()
  checks.env = missing.length ? { ok: false, detail: `missing: ${missing.join(",")}` } : { ok: true }

  // 2. pooler + DB
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  try {
    await withTimeout(
      (async () => {
        await pg.connect()
        await pg.query("SELECT 1")
      })(),
      9000,
      "db"
    )
    checks.database = { ok: true }
  } catch (e: any) {
    checks.database = { ok: false, detail: e.message?.slice(0, 160) }
  } finally {
    try {
      await pg.end()
    } catch {
      /* ignore */
    }
  }

  // 3. ตารางที่โค้ดต้องใช้
  const requiredTables = ["vehicles", "users", "parts", "work_orders", "maintenance_plans", "drivers", "vehicle_types"]
  const optionalTables = ["vehicle_trips", "fuel_consumption", "gps_tracking", "driver_reports"]
  if (checks.database.ok) {
    const pg2 = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    })
    try {
      await pg2.connect()
      const r = await withTimeout(
        pg2.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`),
        9000,
        "tables"
      )
      const existing = new Set(r.rows.map((x: any) => x.tablename))
      const missReq = requiredTables.filter((t) => !existing.has(t))
      const missOpt = optionalTables.filter((t) => !existing.has(t))
      checks.tables = missReq.length
        ? { ok: false, detail: `missing: ${missReq.join(",")}` }
        : { ok: true, detail: missOpt.length ? `optional missing: ${missOpt.join(",")}` : "all present" }
      // คอลัมน์ที่เคยหายแล้วทำล่ม
      const colChecks: [string, string][] = [
        ["users", "photo_url"],
        ["work_orders", "symptoms"],
        ["maintenance_plans", "description"],
      ]
      const missCols: string[] = []
      for (const [tbl, col] of colChecks) {
        const cr = await pg2.query(
          `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
          [tbl, col]
        )
        if (cr.rowCount === 0) missCols.push(`${tbl}.${col}`)
      }
      checks.columns = missCols.length ? { ok: false, detail: `missing: ${missCols.join(",")}` } : { ok: true }
    } catch (e: any) {
      checks.tables = { ok: false, detail: e.message?.slice(0, 160) }
    } finally {
      try {
        await pg2.end()
      } catch {
        /* ignore */
      }
    }
  }

  // 4. Supabase REST + buckets
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("supabase env missing")
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    const ping = await withTimeout(fetch(`${url}/rest/v1/vehicles?select=id&limit=1`, { headers }), 9000, "rest")
    if (!ping.ok) throw new Error(`rest ${ping.status}`)
    const bk = await withTimeout(fetch(`${url}/storage/v1/bucket`, { headers }), 9000, "buckets")
    const buckets: any[] = bk.ok ? await bk.json() : []
    const names = buckets.map((b) => b.name ?? b.id)
    const need = ["vehicle-photos", "user-photos", "driver-photos"]
    const missBk = need.filter((n) => !names.includes(n))
    checks.supabase = { ok: true }
    checks.buckets = missBk.length ? { ok: false, detail: `missing: ${missBk.join(",")}` } : { ok: true }
  } catch (e: any) {
    if (!checks.supabase) checks.supabase = { ok: false, detail: e.message?.slice(0, 160) }
  }

  const failed = Object.entries(checks).filter(([, v]) => !v.ok)
  return NextResponse.json(
    { status: failed.length ? "degraded" : "ok", checks, time: new Date().toISOString() },
    { status: failed.length ? 503 : 200 }
  )
}
