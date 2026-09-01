export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { Client } from "pg"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicleId")

    if (!vehicleId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสรถ" }, { status: 400 })
    }

    await pg.connect()

    const result = await pg.query(
      `SELECT vh.*, u.name as created_by_name
       FROM vehicle_histories vh
       LEFT JOIN users u ON u.id = vh.created_by
       WHERE vh.vehicle_id = $1
       ORDER BY vh.created_at DESC`,
      [vehicleId]
    )

    return NextResponse.json(
      result.rows.map((r) => ({
        id: r.id,
        vehicleId: r.vehicle_id,
        licensePlate: r.license_plate,
        engineNumber: r.engine_number,
        receivedDate: r.received_date?.toISOString() ?? null,
        receivedFrom: r.received_from,
        withdrawer: r.withdrawer,
        engineCc: r.engine_cc,
        horsepower: r.horsepower,
        totalQuantity: r.total_quantity,
        maintenanceDetails: r.maintenance_details,
        createdBy: r.created_by_name,
        createdAt: r.created_at?.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Vehicle histories API error:", error)
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
    const session = await getServerSession(authOptions)
    const body = await request.json()

    if (!body.vehicleId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสรถ" }, { status: 400 })
    }

    await pg.connect()

    const result = await pg.query(
      `INSERT INTO vehicle_histories
        (vehicle_id, license_plate, engine_number, received_date, received_from, withdrawer, engine_cc, horsepower, total_quantity, maintenance_details, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        body.vehicleId,
        body.licensePlate || null,
        body.engineNumber || null,
        body.receivedDate || null,
        body.receivedFrom || null,
        body.withdrawer || null,
        body.engineCc || null,
        body.horsepower || null,
        body.totalQuantity || 0,
        body.maintenanceDetails || null,
        session?.user?.id || null,
      ]
    )

    const r = result.rows[0]
    return NextResponse.json({
      id: r.id,
      vehicleId: r.vehicle_id,
      licensePlate: r.license_plate,
      engineNumber: r.engine_number,
      receivedDate: r.received_date?.toISOString() ?? null,
      receivedFrom: r.received_from,
      withdrawer: r.withdrawer,
      engineCc: r.engine_cc,
      horsepower: r.horsepower,
      totalQuantity: r.total_quantity,
      maintenanceDetails: r.maintenance_details,
      createdAt: r.created_at?.toISOString(),
    })
  } catch (error) {
    console.error("Create vehicle history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
