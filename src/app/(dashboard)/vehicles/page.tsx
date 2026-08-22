"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Plus, Filter, Truck, X } from "lucide-react"
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

function VehiclesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get("status") || ""

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
      (!statusFilter || v.status === statusFilter) &&
      (v.reg?.includes(search) ||
        v.model?.toLowerCase().includes(search.toLowerCase()) ||
        v.brand?.toLowerCase().includes(search.toLowerCase())),
  )

  const clearFilter = () => {
    router.push("/vehicles")
  }

  const filterLabel = statusFilter ? statusMeta[statusFilter]?.label ?? statusFilter : ""

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ยานพาหนะ</h2>
          <p className="text-sm text-muted-foreground">
            {statusFilter ? `กรองโดย: ${filterLabel} (${filtered.length} คัน)` : `รายการยานพาหนะทั้งหมด ${vehicles.length} คัน`}
          </p>
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
        {statusFilter && (
          <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm text-primary">
            <Filter className="size-4" />
            {filterLabel}
            <button onClick={clearFilter} className="ml-1 hover:text-primary/80">
              <X className="size-3" />
            </button>
          </div>
        )}
        <select
          value={statusFilter}
          onChange={(e) => {
            if (e.target.value) {
              router.push(`/vehicles?status=${e.target.value}`)
            } else {
              router.push("/vehicles")
            }
          }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(statusMeta).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">รูป</th>
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
                    <td className="px-4 py-3">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.reg} className="size-10 rounded-lg object-cover" />
                      ) : (
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Truck className="size-5" />
                        </div>
                      )}
                    </td>
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
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-6"><div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div></div>}>
      <VehiclesContent />
    </Suspense>
  )
}
