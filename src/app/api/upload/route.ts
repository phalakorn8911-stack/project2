export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const vehicleId = formData.get("vehicleId") as string | null
    const isPrimary = formData.get("isPrimary") === "true"

    if (!file || !vehicleId) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์และรถ" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "ไม่รองรับประเภทไฟล์นี้" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${vehicleId}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from("vehicle-photos")
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "อัปโหลดล้มเหลว" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from("vehicle-photos")
      .getPublicUrl(filename)

    const photo = await prisma.vehiclePhoto.create({
      data: {
        vehicleId,
        photoUrl: urlData.publicUrl,
        isPrimary,
      },
    })

    return NextResponse.json({
      id: photo.id,
      photoUrl: photo.photoUrl,
      isPrimary: photo.isPrimary,
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("id")

    if (!photoId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสรูปภาพ" }, { status: 400 })
    }

    const photo = await prisma.vehiclePhoto.findUnique({ where: { id: photoId } })
    if (!photo) {
      return NextResponse.json({ error: "ไม่พบรูปภาพ" }, { status: 404 })
    }

    const urlParts = photo.photoUrl.split("/vehicle-photos/")
    if (urlParts.length === 2) {
      await supabase.storage.from("vehicle-photos").remove([urlParts[1]])
    }

    await prisma.vehiclePhoto.delete({ where: { id: photoId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete photo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { photoId, vehicleId } = await request.json()

    if (!photoId || !vehicleId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสรูปภาพและรถ" }, { status: 400 })
    }

    await prisma.vehiclePhoto.updateMany({
      where: { vehicleId },
      data: { isPrimary: false },
    })

    await prisma.vehiclePhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Set primary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
