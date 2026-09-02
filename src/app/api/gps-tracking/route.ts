export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")
    const vehicleId = searchParams.get("vehicleId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const latest = searchParams.get("latest")

    await pg.connect()

    let query = `
      SELECT g.*, d.first_name, d.last_name, v."registrationNumber"
      FROM gps_tracking g
      JOIN drivers d ON d.id = g."driverId"
      JOIN vehicles v ON v.id = g."vehicleId"
      WHERE 1=1
    `
    const params: any[] = []
    let idx = 1

    if (driverId) {
      query += ` AND g."driverId" = $${idx++}`
      params.push(driverId)
    }
    if (vehicleId) {
      query += ` AND g."vehicleId" = $${idx++}`
      params.push(vehicleId)
    }
    if (from) {
      query += ` AND g."recordedAt" >= $${idx++}`
      params.push(from)
    }
    if (to) {
      query += ` AND g."recordedAt" <= $${idx++}`
      params.push(to)
    }

    query += ` ORDER BY g."recordedAt" ASC`

    if (latest === "true") {
      query = `
        SELECT DISTINCT ON (g."driverId") g.*, d.first_name, d.last_name, v."registrationNumber"
        FROM gps_tracking g
        JOIN drivers d ON d.id = g."driverId"
        JOIN vehicles v ON v.id = g."vehicleId"
        ORDER BY g."driverId", g."recordedAt" DESC
      `
    }

    const result = await pg.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("GPS tracking API error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}

export async function POST(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { driverId, vehicleId, latitude, longitude, speed, heading, accuracy } = await request.json()

    if (!driverId || !vehicleId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    await pg.connect()

    const id = crypto.randomUUID()
    await pg.query(
      `INSERT INTO gps_tracking (id, "driverId", "vehicleId", latitude, longitude, speed, heading, accuracy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, driverId, vehicleId, latitude, longitude, speed || 0, heading || 0, accuracy || 0]
    )

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Create GPS record error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
