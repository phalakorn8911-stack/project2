"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Truck, Calendar, Gauge, Fuel } from "lucide-react"
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

const urgencyLabels: Record<string, { label: string; className: string }> = {
  LOW: { label: "ปกติ", className: "text-muted-foreground bg-muted" },
  MEDIUM: { label: "ปานกลาง", className: "text-status-parts bg-status-parts/10" },
  HIGH: { label: "สูง", className: "text-destructive bg-destructive/10" },
  EMERGENCY: { label: "ด่วนมาก", className: "text-destructive bg-destructive" },
}

const scheduleStatusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอดำเนินการ", className: "text-muted-foreground bg-muted" },
  DUE_SOON: { label: "ใกล้ถึงกำหนด", className: "text-status-due bg-status-due/10" },
  OVERDUE: { label: "เกินกำหนด", className: "text-status-overdue bg-status-overdue/10" },
  COMPLETED: { label: "เสร็จแล้ว", className: "text-success bg-success/10" },
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vehicles/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setVehicle(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">กำลังโหลด...</div>
      </div>
    )
  }

  if (!vehicle || vehicle.error) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Truck className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่พบข้อมูลยานพาหนะ</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-info hover:underline">กลับ</button>
        </div>
      </div>
    )
  }

  const status = statusMeta[vehicle.status] ?? { label: vehicle.status, className: "text-muted-foreground bg-muted" }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          กลับ
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Truck className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{vehicle.registrationNumber}</h2>
              <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
            </div>
          </div>
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">ปี</p><p className="font-medium text-card-foreground">{vehicle.year}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">ประเภท</p><p className="font-medium text-card-foreground">{vehicle.vehicleType}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">เลขไมล์</p><p className="font-medium text-card-foreground">{vehicle.currentMileage?.toLocaleString()} กม.</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">เชื้อเพลิง</p><p className="font-medium text-card-foreground">{vehicle.fuelType}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-card-foreground">ประวัติแจ้งซ่อม</h3>
            <p className="text-xs text-muted-foreground">{(vehicle.repairRequests ?? []).length} รายการ</p>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {(vehicle.repairRequests ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีประวัติ</p>
            ) : (
              (vehicle.repairRequests ?? []).map((rr: any) => {
                const urg = urgencyLabels[rr.urgency] ?? urgencyLabels.MEDIUM
                return (
                  <div key={rr.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{rr.requestNumber}</span>
                      <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", urg.className)}>
                        {urg.label}
                      </span>
                    </div>
                    <p className="text-sm text-card-foreground">{rr.symptoms}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{rr.systemCategory}</span>
                      {rr.workOrder && <span>• WO: {rr.workOrder.woNumber}</span>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-card-foreground">แผนซ่อมบำรุง</h3>
            <p className="text-xs text-muted-foreground">{(vehicle.maintenanceSchedules ?? []).length} แผน</p>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {(vehicle.maintenanceSchedules ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีแผน</p>
            ) : (
              (vehicle.maintenanceSchedules ?? []).map((ms: any) => {
                const sStatus = scheduleStatusLabels[ms.status] ?? scheduleStatusLabels.PENDING
                return (
                  <div key={ms.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-card-foreground">{ms.planName}</span>
                      <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", sStatus.className)}>
                        {sStatus.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                      {ms.lastPerformedDate && <p>ทำครั้งล่าสุด: {new Date(ms.lastPerformedDate).toLocaleDateString("th-TH")}</p>}
                      {ms.nextDueDate ? <p>รอบถัดไป: {new Date(ms.nextDueDate).toLocaleDateString("th-TH")}</p> : <p>รอบถัดไป: ยังไม่กำหนด</p>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
