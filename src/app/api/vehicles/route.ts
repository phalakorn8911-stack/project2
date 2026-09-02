export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Client } from "pg"
import { requireAuth } from "@/lib/api-auth"

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error
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
        vehicleTypeId: v.vehicleTypeId,
        unitId: v.unitId,
        fuelType: v.fuelType,
        currentMileage: v.currentMileage,
        type: v.vehicleType.name,
        unit: v.unit.name,
        status: v.status,
        mileage: v.currentMileage.toLocaleString(),
        thumbnail: v.photos.find((p) => p.isPrimary)?.photoUrl ?? v.photos[0]?.photoUrl ?? null,
      }))
    )
  } catch (error) {
    console.error("Vehicles API error:", error)
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
    const body = await request.json()
    const { registrationNumber, brand, model, year, vehicleTypeId, unitId, fuelType, currentMileage, status } = body

    if (!registrationNumber || !brand || !model || !year || !vehicleTypeId || !unitId) {
      return NextResponse.json({ error: "กรุณากรอกทะเบียน, ยี่ห้อ, รุ่น, ปี, ประเภทรถ, หน่วยงาน" }, { status: 400 })
    }

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

    return NextResponse.json({ id: result.rows[0].id, message: "สร้างยานพาหนะสำเร็จ" }, { status: 201 })
  } catch (error: any) {
    console.error("Vehicle create error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "ทะเบียนซ้ำ" }, { status: 409 })
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  } finally {
    await pg.end()
  }
}
