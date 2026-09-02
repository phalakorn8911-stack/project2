export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์และระบุผู้ใช้" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพ" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "รูปภาพมีขนาดเกิน 5MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${userId}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from("user-photos")
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "อัปโหลดล้มเหลว" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from("user-photos")
      .getPublicUrl(filename)

    const photoUrl = urlData.publicUrl

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { photoUrl },
      })
    } catch {
      const { Client } = await import("pg")
      const pg = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
      try {
        await pg.connect()
        await pg.query('UPDATE "users" SET "photo_url" = $1 WHERE "id" = $2', [photoUrl, userId])
      } finally {
        await pg.end()
      }
    }

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error("Upload user photo error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "กรุณาระบุผู้ใช้" }, { status: 400 })
    }

    let photoUrl: string | null = null
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } })
      photoUrl = user?.photoUrl ?? null
    } catch {
      const { Client } = await import("pg")
      const pg = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
      try {
        await pg.connect()
        const r = await pg.query('SELECT "photo_url" FROM "users" WHERE "id" = $1', [userId])
        photoUrl = r.rows[0]?.photo_url ?? null
      } finally {
        await pg.end()
      }
    }

    if (!photoUrl) {
      return NextResponse.json({ error: "ไม่พบรูปภาพ" }, { status: 404 })
    }

    const urlParts = photoUrl.split("/user-photos/")
    if (urlParts.length === 2) {
      await supabase.storage.from("user-photos").remove([urlParts[1]])
    }

    try {
      await prisma.user.update({
        where: { id: userId },
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
        await pg.query('UPDATE "users" SET "photo_url" = NULL WHERE "id" = $1', [userId])
      } finally {
        await pg.end()
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete user photo error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
