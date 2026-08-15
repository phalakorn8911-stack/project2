"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const statusMeta: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "พร้อมใช้งาน", className: "text-status-available bg-status-available/10" },
  IN_USE: { label: "กำลังใช้งาน", className: "text-info bg-info/10" },
  DUE_SOON: { label: "ใกล้ถึงกำหนด", className: "text-status-due bg-status-due/10" },
  OVERDUE: { label: "เกินกำหนด", className: "text-status-overdue bg-status-overdue/10" },
  IN_REPAIR: { label: "กำลังซ่อม", className: "text-status-repair bg-status-repair/10" },
  WAITING_PARTS: { label: "รออะไหล่", className: "text-status-parts bg-status-parts/10" },
  OUT_OF_SERVICE: { label: "ใช้งานไม่ได้", className: "text-destructive bg-destructive/10" },
  RETIRED: { label: "ปลดประจำการ", className: "text-muted-foreground bg-muted" },
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("")
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => { setVehicles(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = vehicles.filter(
    (v) =>
      v.reg?.includes(search) ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.brand?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ยานพาหนะ</h2>
          <p className="text-sm text-muted-foreground">รายการยานพาหนะทั้งหมด {vehicles.length} คัน</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="size-4" />
          เพิ่มยานพาหนะ
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="ค้นหาทะเบียน, รุ่น, ยี่ห้อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
          <Filter className="size-4" />
          ตัวกรอง
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">ทะเบียน</th>
                <th className="px-3 py-3 font-medium">รุ่น</th>
                <th className="px-3 py-3 font-medium">ปี</th>
                <th className="px-3 py-3 font-medium">ประเภท</th>
                <th className="px-3 py-3 font-medium">หน่วยงาน</th>
                <th className="px-3 py-3 font-medium">เลขไมล์</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const status = statusMeta[v.status] ?? { label: v.status, className: "text-muted-foreground bg-muted" }
                return (
                  <tr key={v.id} onClick={() => window.location.href = `/vehicles/${v.id}`} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-card-foreground">{v.reg}</td>
                    <td className="px-3 py-3 text-card-foreground">{v.brand} {v.model}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.year}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.type}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.unit}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.mileage}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
