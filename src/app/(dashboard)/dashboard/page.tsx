"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { ReadinessSection } from "@/components/dashboard/readiness-section"
import { DataTables } from "@/components/dashboard/data-tables"
import { AiSummary } from "@/components/dashboard/ai-summary"
import { VehicleStatusLists } from "@/components/dashboard/vehicle-status-lists"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

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
        />
      )}

      <ChartsSection data={data} />
      <DataTables />
      <AiSummary />
    </div>
  )
}
