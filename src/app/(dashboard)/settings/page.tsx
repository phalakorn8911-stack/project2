"use client"

import { useSession } from "next-auth/react"
import { Settings as SettingsIcon, User, Shield } from "lucide-react"

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  commander: "ผู้บังคับบัญชา",
  vehicle_officer: "เจ้าหน้าที่ยานยนต์",
  driver: "พลขับ",
  mechanic: "ช่างซ่อม",
  head_mechanic: "หัวหน้าช่าง",
  parts_officer: "เจ้าหน้าที่คลังอะไหล่",
}

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">ตั้งค่า</h2>
        <p className="text-sm text-muted-foreground">ข้อมูลบัญชีและการตั้งค่าระบบ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="size-5 text-info" />
            <h3 className="text-sm font-semibold text-card-foreground">ข้อมูลส่วนตัว</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ชื่อ</span>
              <span className="font-medium text-card-foreground">{session?.user?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">อีเมล</span>
              <span className="font-medium text-card-foreground">{session?.user?.email ?? "-"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="size-5 text-info" />
            <h3 className="text-sm font-semibold text-card-foreground">สิทธิ์การใช้งาน</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">บทบาท</span>
              <span className="font-medium text-card-foreground">{roleLabels[session?.user?.role as string] ?? session?.user?.role ?? "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">หน่วยงาน</span>
              <span className="font-medium text-card-foreground">{session?.user?.unitId ?? "-"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="size-5 text-info" />
            <h3 className="text-sm font-semibold text-card-foreground">เกี่ยวกับระบบ</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ชื่อระบบ</span>
              <span className="font-medium text-card-foreground">Smart Army Vehicle Maintenance Dashboard</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">เวอร์ชัน</span>
              <span className="font-medium text-card-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">เทคโนโลยี</span>
              <span className="font-medium text-card-foreground">Next.js 16 + Prisma + Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
