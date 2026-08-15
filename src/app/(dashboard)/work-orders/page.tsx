"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const columns = [
  { key: "OPEN", label: "รอรับงาน", color: "border-t-chart-1" },
  { key: "IN_PROGRESS", label: "กำลังซ่อม", color: "border-t-chart-2" },
  { key: "WAITING_PARTS", label: "รออะไหล่", color: "border-t-chart-3" },
  { key: "COMPLETED", label: "ซ่อมเสร็จ", color: "border-t-chart-4" },
]

const urgencyMeta: Record<string, { label: string; className: string }> = {
  LOW: { label: "ปกติ", className: "bg-muted text-muted-foreground" },
  MEDIUM: { label: "ปานกลาง", className: "bg-status-parts/10 text-status-parts" },
  HIGH: { label: "สูง", className: "bg-destructive/10 text-destructive" },
  EMERGENCY: { label: "สูงมาก", className: "bg-destructive text-destructive-foreground" },
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/work-orders")
      .then((r) => r.json())
      .then((data) => { setWorkOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ใบงานซ่อม</h2>
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-5 w-24 rounded bg-muted mb-2" />
              <div className="h-4 w-16 rounded bg-muted mb-4" />
              <div className="h-20 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ใบงานซ่อม</h2>
          <p className="text-sm text-muted-foreground">บอร์ดแสดงสถานะใบงานซ่อม ({workOrders.length} รายการ)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="rounded-xl border border-border bg-card">
            <div className={cn("rounded-t-xl border-t-2", col.color)}>
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-card-foreground">{col.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {workOrders.filter((wo) => wo.status === col.key).length} งาน
                </p>
              </div>
            </div>
            <div className="p-3 space-y-3 min-h-[200px]">
              {workOrders
                .filter((wo) => wo.status === col.key)
                .map((wo) => {
                  const urg = urgencyMeta[wo.urgency] ?? urgencyMeta.MEDIUM
                  return (
                    <div
                      key={wo.id}
                      className="rounded-lg border border-border bg-background p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-xs font-mono text-muted-foreground">{wo.wo}</span>
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", urg.className)}>
                          {urg.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-card-foreground">{wo.vehicle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{wo.issue}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        ช่าง: <span className="font-medium text-card-foreground">{wo.mechanic}</span>
                      </p>
                    </div>
                  )
                })}
              {workOrders.filter((wo) => wo.status === col.key).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">ไม่มีรายการ</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
