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
      return NextResponse.json({ error: "Missing file or driverId" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${driverId}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from("driver-photos")
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from("driver-photos")
      .getPublicUrl(filename)

    await prisma.driver.update({
      where: { id: driverId },
      data: { photoUrl: urlData.publicUrl },
    })

    return NextResponse.json({
      photoUrl: urlData.publicUrl,
    })
  } catch (error) {
    console.error("Upload driver photo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Missing driverId" }, { status: 400 })
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } })
    if (!driver || !driver.photoUrl) {
      return NextResponse.json({ error: "No photo to delete" }, { status: 404 })
    }

    const urlParts = driver.photoUrl.split("/driver-photos/")
    if (urlParts.length === 2) {
      await supabase.storage.from("driver-photos").remove([urlParts[1]])
    }

    await prisma.driver.update({
      where: { id: driverId },
      data: { photoUrl: null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete driver photo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
