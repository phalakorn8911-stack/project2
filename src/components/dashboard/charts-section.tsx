"use client"

import { useEffect, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type DashboardData = {
  vehicles: { total: number; available: number; inRepair: number; waitingParts: number; dueSoon: number; overdue: number; inUse: number; outOfService: number; retired: number }
  workOrders: { open: number; inProgress: number; waitingParts: number; completed: number }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-popover-foreground font-medium">{label ?? payload[0].name}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

export function ChartsSection({ data: initialData }: { data?: any }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !initialData?.vehicles) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="h-4 w-36 rounded bg-muted mb-1" />
            <div className="h-4 w-48 rounded bg-muted/60 mb-4" />
            <div className="h-56 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    )
  }

  const readinessData = [
    { name: "พร้อมใช้งาน", value: initialData.vehicles.available, color: "var(--status-available)" },
    { name: "กำลังซ่อม", value: initialData.vehicles.inRepair, color: "var(--status-repair)" },
    { name: "รออะไหล่", value: initialData.vehicles.waitingParts, color: "var(--status-parts)" },
    { name: "อื่นๆ", value: Math.max(0, initialData.vehicles.total - initialData.vehicles.available - initialData.vehicles.inRepair - initialData.vehicles.waitingParts), color: "var(--muted-foreground)" },
  ]

  const vehicleStatusData = [
    { name: "พร้อมใช้งาน", value: initialData.vehicles.available, color: "var(--status-available)" },
    { name: "กำลังใช้งาน", value: initialData.vehicles.inUse, color: "var(--chart-1)" },
    { name: "กำลังซ่อม", value: initialData.vehicles.inRepair, color: "var(--status-repair)" },
    { name: "รออะไหล่", value: initialData.vehicles.waitingParts, color: "var(--status-parts)" },
    { name: "ใกล้รอบซ่อม", value: initialData.vehicles.dueSoon, color: "var(--status-due)" },
    { name: "เกินรอบซ่อม", value: initialData.vehicles.overdue, color: "var(--status-overdue)" },
    { name: "ไม่พร้อมใช้งาน", value: initialData.vehicles.outOfService, color: "var(--chart-4)" },
    { name: "ปลดระวาง", value: initialData.vehicles.retired, color: "var(--muted-foreground)" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-1">ความพร้อมของยานพาหนะ</h3>
        <p className="text-xs text-muted-foreground mb-4">อัตราความพร้อมใช้งาน</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={readinessData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {readinessData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {readinessData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-1">สถานะยานยนต์</h3>
        <p className="text-xs text-muted-foreground mb-4">จำนวนยานยนต์แยกตามสถานะ</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleStatusData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} strokeWidth={0}>
                {vehicleStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-1">สรุปข้อมูล</h3>
        <p className="text-xs text-muted-foreground mb-4">สถิติภาพรวม</p>
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">รถทั้งหมด</span>
            <span className="text-sm font-semibold text-card-foreground">{initialData.vehicles.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">พร้อมใช้งาน</span>
            <span className="text-sm font-semibold text-success">{initialData.vehicles.available}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">กำลังซ่อม</span>
            <span className="text-sm font-semibold text-status-repair">{initialData.vehicles.inRepair}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ใกล้ถึงกำหนด</span>
            <span className="text-sm font-semibold text-status-due">{initialData.vehicles.dueSoon}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">เกินกำหนด</span>
            <span className="text-sm font-semibold text-status-overdue">{initialData.vehicles.overdue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
