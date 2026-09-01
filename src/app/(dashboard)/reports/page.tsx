"use client"

import { useEffect, useState } from "react"
import { FileText, Printer, Truck, Wrench, Package, ClipboardCheck, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ReportsPage() {
  const [dashData, setDashData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) { setLoading(false); return null }
        return r.json()
      })
      .then((d) => { if (d) setDashData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      </div>
    )
  }

  if (!dashData?.vehicles) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">รายงานสถานภาพยานยนต์</h2>
          <p className="text-sm text-muted-foreground">สรุปรายงานภาพรวมระบบ ร.153 พัน.3</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  const totalVehicles = dashData?.vehicles?.total ?? 0
  const availablePct = totalVehicles > 0 ? Math.round(((dashData?.vehicles?.available ?? 0) / totalVehicles) * 100) : 0
  const repairPct = totalVehicles > 0 ? Math.round((((dashData?.vehicles?.inRepair ?? 0) + (dashData?.vehicles?.waitingParts ?? 0)) / totalVehicles) * 100) : 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">รายงานสถานภาพยานยนต์</h2>
          <p className="text-sm text-muted-foreground">สรุปรายงานภาพรวมระบบ ร.153 พัน.3</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity print:hidden"
        >
          <Printer className="size-4" />
          พิมพ์รายงาน
        </button>
      </div>

      {dashData?.vehicles && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Truck className="size-5" />} label="ยานพาหนะทั้งหมด" value={`${totalVehicles} คัน`} color="text-primary" />
            <StatCard icon={<TrendingUp className="size-5" />} label="พร้อมใช้งาน" value={`${availablePct}%`} color="text-success" />
            <StatCard icon={<Wrench className="size-5" />} label="ค้างซ่อม" value={`${repairPct}%`} color="text-status-repair" />
            <StatCard icon={<Package className="size-5" />} label="อะไหล่ใกล้หมด" value={`${dashData.lowStockCount ?? 0} รายการ`} color="text-destructive" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="size-5 text-info" />
                <h3 className="text-sm font-semibold text-card-foreground">สถานะยานพาหนะ</h3>
              </div>
              <div className="space-y-3">
                <ReportRow label="พร้อมใช้งาน" value={dashData.vehicles.available} total={totalVehicles} color="bg-success" />
                <ReportRow label="กำลังซ่อม" value={dashData.vehicles.inRepair} total={totalVehicles} color="bg-status-repair" />
                <ReportRow label="รออะไหล่" value={dashData.vehicles.waitingParts} total={totalVehicles} color="bg-status-parts" />
                <ReportRow label="ใกล้ถึงกำหนด" value={dashData.vehicles.dueSoon} total={totalVehicles} color="bg-status-due" />
                <ReportRow label="เกินกำหนด" value={dashData.vehicles.overdue} total={totalVehicles} color="bg-status-overdue" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="size-5 text-warning" />
                <h3 className="text-sm font-semibold text-card-foreground">ใบงานซ่อมบำรุง</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">รอรับงาน</span><span className="font-medium text-card-foreground">{dashData.workOrders.open} งาน</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">กำลังซ่อม</span><span className="font-medium text-card-foreground">{dashData.workOrders.inProgress} งาน</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">รออะไหล่</span><span className="font-medium text-status-parts">{dashData.workOrders.waitingParts} งาน</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">ซ่อมเสร็จ</span><span className="font-medium text-success">{dashData.workOrders.completed} งาน</span></div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm"><span className="text-muted-foreground">ค่าอะไหล่สะสม</span><span className="font-medium text-card-foreground">฿{(dashData.totalPartsCost ?? 0).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardCheck className="size-5 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">การบำรุงรักษา</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">เกินรอบซ่อม</span><span className="font-medium text-status-overdue">{dashData.overdueSchedules} รายการ</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">ใกล้ถึงกำหนด</span><span className="font-medium text-status-due">{dashData.dueSoonSchedules} รายการ</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">รออนุมัติซ่อม</span><span className="font-medium text-info">{dashData.pendingRepairs} รายการ</span></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn("mb-2", color)}>{icon}</div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function ReportRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-card-foreground">{value} คัน ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
