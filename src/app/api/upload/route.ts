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
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเนเธเธฅเนเนเธฅเธฐเธฃเธ–" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "เนเธกเนเธฃเธญเธเธฃเธฑเธเธเธฃเธฐเน€เธ เธ—เนเธเธฅเนเธเธตเน" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "เนเธเธฅเนเธกเธตเธเธเธฒเธ”เนเธซเธเนเน€เธเธดเธเนเธ (เธชเธนเธเธชเธธเธ” 5MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${vehicleId}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from("vehicle-photos")
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "เธญเธฑเธเนเธซเธฅเธ”เธฅเนเธกเน€เธซเธฅเธง" }, { status: 500 })
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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("id")

    if (!photoId) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธฃเธซเธฑเธชเธฃเธนเธเธ เธฒเธ" }, { status: 400 })
    }

    const photo = await prisma.vehiclePhoto.findUnique({ where: { id: photoId } })
    if (!photo) {
      return NextResponse.json({ error: "เนเธกเนเธเธเธฃเธนเธเธ เธฒเธ" }, { status: 404 })
    }

    const urlParts = photo.photoUrl.split("/vehicle-photos/")
    if (urlParts.length === 2) {
      await supabase.storage.from("vehicle-photos").remove([urlParts[1]])
    }

    await prisma.vehiclePhoto.delete({ where: { id: photoId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete photo error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { photoId, vehicleId } = await request.json()

    if (!photoId || !vehicleId) {
      return NextResponse.json({ error: "เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธฃเธซเธฑเธชเธฃเธนเธเธ เธฒเธเนเธฅเธฐเธฃเธ–" }, { status: 400 })
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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
