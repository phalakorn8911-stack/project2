"use client"

import { useEffect, useState } from "react"
import { Shield, AlertTriangle } from "lucide-react"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { DataTables } from "@/components/dashboard/data-tables"
import { AiSummary } from "@/components/dashboard/ai-summary"
import { VehicleStatusLists } from "@/components/dashboard/vehicle-status-lists"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) { setError(true); return null }
        return res.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">ภาพรวมระบบ</h2>
            <p className="text-sm text-muted-foreground">ข้อมูลสถานะยานพาหนะและงานซ่อมบำรุงทั้งหมด</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="size-8 text-status-overdue mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">ภาพรวมระบบ</h2>
          <p className="text-sm text-muted-foreground">
            ข้อมูลสถานะยานพาหนะและงานซ่อมบำรุงทั้งหมด
          </p>
        </div>
      </div>

      <SummaryCards data={data} />

      {data && (
        <VehicleStatusLists
          available={data.vehicleLists?.available ?? []}
          inRepair={data.vehicleLists?.inRepair ?? []}
          waitingParts={data.vehicleLists?.waitingParts ?? []}
          dueSoon={data.vehicleLists?.dueSoon ?? []}
          overdue={data.vehicleLists?.overdue ?? []}
        />
      )}

      <ChartsSection data={data} />
      <DataTables />
      <AiSummary />
    </div>
  )
}
