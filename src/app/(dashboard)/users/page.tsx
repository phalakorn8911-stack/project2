"use client"

import { useEffect, useState } from "react"
import { Users as UsersIcon, Shield, UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  commander: "ผู้บังคับบัญชา",
  vehicle_officer: "เจ้าหน้าที่ยานยนต์",
  driver: "พลขับ",
  mechanic: "ช่างซ่อม",
  head_mechanic: "หัวหน้าช่าง",
  parts_officer: "เจ้าหน้าที่คลังอะไหล่",
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">จัดการผู้ใช้</h2>
          <p className="text-sm text-muted-foreground">รายชื่อผู้ใช้ทั้งหมด {users.length} คน</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-3 py-3 font-medium">อีเมล</th>
                <th className="px-3 py-3 font-medium">บทบาท</th>
                <th className="px-3 py-3 font-medium">หน่วยงาน</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <UsersIcon className="size-4" />
                      </div>
                      <span className="font-medium text-card-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Shield className="size-3" />
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{u.unit}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      u.status === "ACTIVE" ? "text-success bg-success/10" : "text-muted-foreground bg-muted"
                    )}>
                      {u.status === "ACTIVE" ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                      {u.status === "ACTIVE" ? "ใช้งาน" : "ระงับ"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
