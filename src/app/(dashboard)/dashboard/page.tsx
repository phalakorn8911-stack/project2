"use client"

import { useEffect, useState } from "react"
import { Shield, AlertTriangle, Truck, Navigation, ChevronRight } from "lucide-react"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { DataTables } from "@/components/dashboard/data-tables"
import { AiSummary } from "@/components/dashboard/ai-summary"
import { VehicleStatusLists } from "@/components/dashboard/vehicle-status-lists"
import { cn } from "@/lib/utils"

function ActiveTripsSection({ trips }: { trips: any[] }) {
  if (!trips || trips.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-info/10"><Navigation className="size-4 text-info" /></div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">รถกำลังเดินทาง</h3>
            <p className="text-xs text-muted-foreground">{trips.length} คัน</p>
          </div>
        </div>
        <button onClick={() => window.location.href = "/gps-tracking"} className="text-xs text-primary hover:underline">ดูทั้งหมด →</button>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-2">
          {trips.map((trip: any) => {
            const elapsed = Math.floor((Date.now() - new Date(trip.startedAt).getTime()) / 60000)
            return (
              <div key={trip.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = "/gps-tracking"}>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info"><Truck className="size-4" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground">{trip.registrationNumber}</p>
                      <span className="inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">กำลังเดินทาง</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{trip.driverName} • {trip.brand} {trip.model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><ChevronRight className="size-3" /> {elapsed} นาที</p>
                  <p className="text-[10px] text-muted-foreground">{trip.origin.split(" ")[0]} → {trip.destination.split(" ")[0]}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => { if (!res.ok) { setError(true); return null }; return res.json() })
      .then((d) => { if (d) setData(d) })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
          <div><h2 className="text-xl font-bold text-foreground tracking-tight">ภาพรวมระบบ</h2><p className="text-sm text-muted-foreground">ข้อมูลสถานะยานพาหนะและงานซ่อมบำรุงทั้งหมด</p></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="size-8 text-status-overdue mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">ลองใหม่</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
        <div><h2 className="text-xl font-bold text-foreground tracking-tight">ภาพรวมระบบ</h2><p className="text-sm text-muted-foreground">ข้อมูลสถานะยานพาหนะและงานซ่อมบำรุงทั้งหมด</p></div>
      </div>

      <SummaryCards data={data} />

      {data?.activeTrips && data.activeTrips.length > 0 && <ActiveTripsSection trips={data.activeTrips} />}

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
