export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET() {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    await pg.connect()

    const driversResult = await pg.query(
      `SELECT d.id, d.rank, d.first_name, d.last_name, d.photo_url
       FROM drivers d ORDER BY d.rank ASC`
    )

    const vehiclesResult = await pg.query(
      `SELECT vd.driver_id, v.id as vehicle_id, v."registrationNumber", v.brand, v.model
       FROM vehicle_drivers vd
       JOIN vehicles v ON v.id = vd.vehicle_id`
    )

    const vehicleMap = new Map<string, any[]>()
    for (const row of vehiclesResult.rows) {
      if (!vehicleMap.has(row.driver_id)) vehicleMap.set(row.driver_id, [])
      vehicleMap.get(row.driver_id)!.push({
        id: row.vehicle_id,
        registrationNumber: row.registrationNumber,
        brand: row.brand,
        model: row.model,
      })
    }

    return NextResponse.json(
      driversResult.rows.map((d) => ({
        id: d.id,
        rank: d.rank,
        firstName: d.first_name,
        lastName: d.last_name,
        photoUrl: d.photo_url,
        vehicles: vehicleMap.get(d.id) ?? [],
      }))
    )
  } catch (error) {
    console.error("Drivers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const { rank, firstName, lastName, photoUrl } = await request.json()

    if (!rank || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await pg.connect()
    const result = await pg.query(
      `INSERT INTO drivers (id, rank, first_name, last_name, photo_url)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, rank, first_name, last_name, photo_url`,
      [rank, firstName, lastName, photoUrl || null]
    )

    const d = result.rows[0]
    return NextResponse.json({
      id: d.id,
      rank: d.rank,
      firstName: d.first_name,
      lastName: d.last_name,
      photoUrl: d.photo_url,
    })
  } catch (error) {
    console.error("Create driver error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
