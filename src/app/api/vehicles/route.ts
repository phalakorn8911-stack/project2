export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Client } from "pg"

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { unit: true, vehicleType: true, photos: true },
      orderBy: { registrationNumber: "asc" },
    })

    return NextResponse.json(
      vehicles.map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        type: v.vehicleType.name,
        unit: v.unit.name,
        status: v.status,
        mileage: v.currentMileage.toLocaleString(),
        thumbnail: v.photos.find((p) => p.isPrimary)?.photoUrl ?? v.photos[0]?.photoUrl ?? null,
      }))
    )
  } catch (error) {
    console.error("Vehicles API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registrationNumber, brand, model, year, vehicleTypeId, unitId, fuelType, currentMileage, status } = body

    if (!registrationNumber || !brand || !model || !year || !vehicleTypeId || !unitId) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น" }, { status: 400 })
    }

    const pg = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    await pg.connect()

    const id = crypto.randomUUID()
    const result = await pg.query(
      `INSERT INTO "vehicles" ("id", "registrationNumber", "brand", "model", "year", "vehicleTypeId", "unitId", "fuelType", "currentMileage", "status", "engineHours")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING "id"`,
      [
        id,
        registrationNumber,
        brand,
        model,
        year,
        vehicleTypeId,
        unitId,
        fuelType || "Diesel",
        currentMileage || 0,
        status || "AVAILABLE",
        0,
      ]
    )

    await pg.end()

    return NextResponse.json({ id: result.rows[0].id, message: "สร้างยานพาหนะสำเร็จ" }, { status: 201 })
  } catch (error: any) {
    console.error("Vehicle create error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "ทะเบียนรถซ้ำ" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
