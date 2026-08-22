"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type DueMaintenance = { vehicleId: string; vehicle: string; model: string; type: string; dueDate: string; status: string; statusColor: string }
type UrgentRepair = { vehicleId: string; vehicle: string; issue: string; priority: string; priorityColor: string; assignedTo: string }
type LowStock = { part: string; code: string; stock: number; min: number; status: string; statusColor: string }

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {label}
    </span>
  )
}

export function DataTables() {
  const router = useRouter()
  const [dueMaintenance, setDueMaintenance] = useState<DueMaintenance[]>([])
  const [urgentRepairs, setUrgentRepairs] = useState<UrgentRepair[]>([])
  const [lowStockParts, setLowStockParts] = useState<LowStock[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/due-maintenance").then((r) => r.json()),
      fetch("/api/work-orders").then((r) => r.json()),
      fetch("/api/parts").then((r) => r.json()),
    ]).then(([dueData, woData, partsData]) => {
      setDueMaintenance(dueData)
      setLowStockParts(
        partsData
          .filter((p: any) => p.stock <= p.min)
          .map((p: any) => ({
            part: p.name,
            code: p.code,
            stock: p.stock,
            min: p.min,
            status: p.stock <= p.min / 2 ? "วิกฤติ" : "ใกล้หมด",
            statusColor: p.stock <= p.min / 2 ? "text-destructive bg-destructive/10" : "text-status-parts bg-status-parts/10",
          }))
      )
      setUrgentRepairs(
        woData
          .filter((wo: any) => wo.status === "IN_PROGRESS" || wo.urgency === "EMERGENCY")
          .slice(0, 5)
          .map((wo: any) => ({
            vehicleId: wo.vehicleId || "",
            vehicle: wo.vehicle,
            issue: wo.issue,
            priority: wo.urgency === "EMERGENCY" ? "สูงมาก" : wo.urgency === "HIGH" ? "สูง" : "ปานกลาง",
            priorityColor: wo.urgency === "EMERGENCY" || wo.urgency === "HIGH" ? "text-destructive bg-destructive/10" : "text-status-parts bg-status-parts/10",
            assignedTo: wo.mechanic,
          }))
      )
    }).catch(() => {})
  }, [])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">ใกล้ถึงกำหนดซ่อม</h3>
            <p className="text-xs text-muted-foreground">{dueMaintenance.length} รายการที่ต้องดำเนินการ</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">ทะเบียน</th>
                <th className="px-3 py-2 font-medium">ประเภท</th>
                <th className="px-3 py-2 font-medium">วันที่</th>
                <th className="px-5 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="border-t border-border">
              {dueMaintenance.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/vehicles/${row.vehicleId}`)}>
                  <td className="px-5 py-2.5 font-medium text-card-foreground">{row.vehicle}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[13px]">{row.type}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[13px]">{row.dueDate}</td>
                  <td className="px-5 py-2.5"><Badge label={row.status} className={row.statusColor} /></td>
                </tr>
              ))}
              {dueMaintenance.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">ซ่อมด่วน</h3>
            <p className="text-xs text-muted-foreground">รายการที่ต้องดำเนินการโดยเร็ว</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">ทะเบียน</th>
                <th className="px-3 py-2 font-medium">อาการ</th>
                <th className="px-3 py-2 font-medium">ด่วน</th>
                <th className="px-5 py-2 font-medium">ช่าง</th>
              </tr>
            </thead>
            <tbody className="border-t border-border">
              {urgentRepairs.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => row.vehicleId && router.push(`/vehicles/${row.vehicleId}`)}>
                  <td className="px-5 py-2.5 font-medium text-card-foreground">{row.vehicle}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[13px] max-w-[140px] truncate">{row.issue}</td>
                  <td className="px-3 py-2.5"><Badge label={row.priority} className={row.priorityColor} /></td>
                  <td className="px-5 py-2.5 text-muted-foreground text-[13px]">{row.assignedTo}</td>
                </tr>
              ))}
              {urgentRepairs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">อะไหล่ใกล้หมด</h3>
            <p className="text-xs text-muted-foreground">{lowStockParts.length} รายการที่ต้องสั่งเพิ่ม</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">อะไหล่</th>
                <th className="px-3 py-2 font-medium">รหัส</th>
                <th className="px-3 py-2 font-medium">คงเหลือ</th>
                <th className="px-5 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="border-t border-border">
              {lowStockParts.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-card-foreground">{row.part}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[13px]">{row.code}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[13px]">
                    <span className={cn(row.stock <= row.min / 2 ? "text-destructive font-medium" : "text-muted-foreground")}>{row.stock}</span>
                    <span className="text-muted-foreground">/{row.min}</span>
                  </td>
                  <td className="px-5 py-2.5"><Badge label={row.status} className={row.statusColor} /></td>
                </tr>
              ))}
              {lowStockParts.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
