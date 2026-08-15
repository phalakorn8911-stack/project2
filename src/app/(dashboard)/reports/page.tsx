"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">รายงาน</h2>
          <p className="text-sm text-muted-foreground">สรุปรายงานภาพรวมระบบ</p>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-5 text-info" />
              <h3 className="text-sm font-semibold text-card-foreground">สรุปยานพาหนะ</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ยานพาหนะทั้งหมด</span><span className="font-medium text-card-foreground">{data.vehicles.total} คัน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">พร้อมใช้งาน</span><span className="font-medium text-success">{data.vehicles.available} คัน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">กำลังซ่อม</span><span className="font-medium text-status-repair">{data.vehicles.inRepair} คัน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">รออะไหล่</span><span className="font-medium text-status-parts">{data.vehicles.waitingParts} คัน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ใกล้ถึงกำหนด</span><span className="font-medium text-status-due">{data.vehicles.dueSoon} คัน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">เกินกำหนด</span><span className="font-medium text-status-overdue">{data.vehicles.overdue} คัน</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-5 text-info" />
              <h3 className="text-sm font-semibold text-card-foreground">สรุปงานซ่อม</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">รอรับงาน</span><span className="font-medium text-card-foreground">{data.workOrders.open} งาน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">กำลังซ่อม</span><span className="font-medium text-card-foreground">{data.workOrders.inProgress} งาน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">รออะไหล่</span><span className="font-medium text-card-foreground">{data.workOrders.waitingParts} งาน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ซ่อมเสร็จ</span><span className="font-medium text-card-foreground">{data.workOrders.completed} งาน</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ค่าอะไหล่สะสม</span><span className="font-medium text-card-foreground">฿{data.monthlyCost.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">อะไหล่ใกล้หมด</span><span className="font-medium text-destructive">{data.lowStockCount} รายการ</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-5 text-info" />
              <h3 className="text-sm font-semibold text-card-foreground">สรุปการบำรุงรักษา</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">เกินรอบซ่อม</span><span className="font-medium text-status-overdue">{data.overdueSchedules} รายการ</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ใกล้ถึงกำหนด</span><span className="font-medium text-status-due">{data.dueSoonSchedules} รายการ</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">รออนุมัติซ่อม</span><span className="font-medium text-info">{data.pendingRepairs} รายการ</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-5 text-info" />
              <h3 className="text-sm font-semibold text-card-foreground">สรุปคลังอะไหล่</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">อะไหล่ใกล้หมด</span><span className="font-medium text-destructive">{data.lowStockCount} รายการ</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ค่าอะไหล่สะสม</span><span className="font-medium text-card-foreground">฿{data.monthlyCost.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
