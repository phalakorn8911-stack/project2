"use client"

import { useRouter } from "next/navigation"
import { Truck, Wrench, Package, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type Vehicle = {
  id: string
  registrationNumber: string
  model: string
  vehicleType?: string
  status: string
}

type Props = {
  available: Vehicle[]
  inRepair: Vehicle[]
  waitingParts: Vehicle[]
  dueSoon: Vehicle[]
  overdue: Vehicle[]
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  available: { label: "พร้อมใช้งาน", icon: Truck, color: "text-success", bgColor: "bg-success/10" },
  inRepair: { label: "กำลังซ่อม", icon: Wrench, color: "text-status-repair", bgColor: "bg-status-repair/10" },
  waitingParts: { label: "รออะไหล่", icon: Package, color: "text-status-parts", bgColor: "bg-status-parts/10" },
  dueSoon: { label: "ใกล้รอบซ่อม", icon: Clock, color: "text-status-due", bgColor: "bg-status-due/10" },
  overdue: { label: "เกินรอบซ่อม", icon: AlertTriangle, color: "text-status-overdue", bgColor: "bg-status-overdue/10" },
}

export function VehicleStatusLists({ available, inRepair, waitingParts, dueSoon, overdue }: Props) {
  const router = useRouter()

  const sections = [
    { key: "available", data: available },
    { key: "inRepair", data: inRepair },
    { key: "waitingParts", data: waitingParts },
    { key: "dueSoon", data: dueSoon },
    { key: "overdue", data: overdue },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sections.map(({ key, data }) => {
        const config = statusConfig[key]
        const Icon = config.icon
        return (
          <div key={key} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className={cn("flex size-8 items-center justify-center rounded-lg", config.bgColor)}>
                  <Icon className={cn("size-4", config.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{config.label}</h3>
                  <p className="text-xs text-muted-foreground">{data.length} คัน</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              {data.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">ไม่มีรายการ</p>
              ) : (
                <div className="space-y-2">
                  {data.map((v, idx) => (
                    <div
                      key={`${key}-${v.id}-${idx}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/vehicles/${v.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Truck className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{v.registrationNumber}</p>
                          <p className="text-xs text-muted-foreground">{v.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {v.vehicleType && <p className="text-xs text-muted-foreground">{v.vehicleType}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
