"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/maintenance-plans")
      .then((r) => r.json())
      .then((data) => { setPlans(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">แผนซ่อมบำรุง</h2>
          <p className="text-sm text-muted-foreground">รายการแผนซ่อมบำรุงตามรอบ ({plans.length} แผน)</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <ClipboardCheck className="size-4" />
          เพิ่มแผน
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-5 w-40 rounded bg-muted mb-2" />
              <div className="h-4 w-28 rounded bg-muted mb-4" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ClipboardCheck className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่มีแผนซ่อมบำรุง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-info/10 text-info">
                  <ClipboardCheck className="size-4" />
                </div>
                {p.overdue > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-destructive bg-destructive/10">
                    <AlertTriangle className="size-3" />
                    เกินกำหนด {p.overdue}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-card-foreground mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{p.vehicleType}</p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3" />
                  {p.intervalMonths && `ทุก ${p.intervalMonths} เดือน`}
                  {p.intervalHours && ` / ${p.intervalHours.toLocaleString()} ชม.`}
                  {p.intervalMileage && ` / ${p.intervalMileage.toLocaleString()} กม.`}
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">รถในแผน</span>
                  <span className="font-medium text-card-foreground">{p.totalVehicles} คัน</span>
                </div>
                {p.dueSoon > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ใกล้ถึงกำหนด</span>
                    <span className="font-medium text-status-due">{p.dueSoon} คัน</span>
                  </div>
                )}
                {p.overdue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เกินกำหนด</span>
                    <span className="font-medium text-status-overdue">{p.overdue} คัน</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
