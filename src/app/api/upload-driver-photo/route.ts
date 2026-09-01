export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const driverId = formData.get("driverId") as string | null

    if (!file || !driverId) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเนเธเธฅเนเนเธฅเธฐเธฃเธซเธฑเธชเธเธฅเธเธฑเธ" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "เนเธกเนเธฃเธญเธเธฃเธฑเธเธเธฃเธฐเน€เธ เธ—เนเธเธฅเนเธเธตเน" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "เนเธเธฅเนเธกเธตเธเธเธฒเธ”เนเธซเธเนเน€เธเธดเธเนเธ (เธชเธนเธเธชเธธเธ” 5MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${driverId}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from("driver-photos")
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "อัปโหลดล้มเหลว: " + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from("driver-photos")
      .getPublicUrl(filename)

    const photoUrl = urlData.publicUrl

    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: { photoUrl },
      })
    } catch (prismaErr) {
      console.error("Prisma update failed, trying raw SQL:", prismaErr)
      const { Client } = await import("pg")
      const pg = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
      try {
        await pg.connect()
        await pg.query('UPDATE drivers SET photo_url = $1 WHERE id = $2', [photoUrl, driverId])
      } finally {
        await pg.end()
      }
    }

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error("Upload driver photo error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธฃเธซเธฑเธชเธเธฅเธเธฑเธ" }, { status: 400 })
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } })
    if (!driver || !driver.photoUrl) {
      return NextResponse.json({ error: "เนเธกเนเธกเธตเธฃเธนเธเธ เธฒเธเนเธซเนเธฅเธ" }, { status: 404 })
    }

    const urlParts = driver.photoUrl.split("/driver-photos/")
    if (urlParts.length === 2) {
      await supabase.storage.from("driver-photos").remove([urlParts[1]])
    }

    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: { photoUrl: null },
      })
    } catch {
      const { Client } = await import("pg")
      const pg = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
      try {
        await pg.connect()
        await pg.query('UPDATE drivers SET photo_url = NULL WHERE id = $1', [driverId])
      } finally {
        await pg.end()
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete driver photo error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
