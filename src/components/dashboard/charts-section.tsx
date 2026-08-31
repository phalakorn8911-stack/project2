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
  LineChart,
  Line,
} from "recharts"

type DashboardData = {
  vehicles: { total: number; available: number; inRepair: number; waitingParts: number; dueSoon: number; overdue: number }
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
  const [data, setData] = useState<DashboardData | null>(initialData ?? null)

  useEffect(() => {
    setMounted(true)
    if (!initialData) {
      fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => {})
    }
  }, [initialData])

  if (!mounted || !data) {
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
    { name: "พร้อมใช้งาน", value: data.vehicles.available, color: "var(--status-available)" },
    { name: "กำลังซ่อม", value: data.vehicles.inRepair, color: "var(--status-repair)" },
    { name: "รออะไหล่", value: data.vehicles.waitingParts, color: "var(--status-parts)" },
    { name: "อื่นๆ", value: Math.max(0, data.vehicles.total - data.vehicles.available - data.vehicles.inRepair - data.vehicles.waitingParts), color: "var(--muted-foreground)" },
  ]

  const workOrderData = [
    { name: "รอรับงาน", value: data.workOrders.open, color: "var(--chart-1)" },
    { name: "กำลังซ่อม", value: data.workOrders.inProgress, color: "var(--chart-2)" },
    { name: "รออะไหล่", value: data.workOrders.waitingParts, color: "var(--chart-3)" },
    { name: "ซ่อมเสร็จ", value: data.workOrders.completed, color: "var(--chart-4)" },
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
        <h3 className="text-sm font-semibold text-card-foreground mb-1">สถานะใบงานซ่อม</h3>
        <p className="text-xs text-muted-foreground mb-4">จำนวนใบงานแยกตามสถานะ</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workOrderData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} strokeWidth={0}>
                {workOrderData.map((entry, i) => (
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
            <span className="text-sm font-semibold text-card-foreground">{data.vehicles.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">พร้อมใช้งาน</span>
            <span className="text-sm font-semibold text-success">{data.vehicles.available}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">กำลังซ่อม</span>
            <span className="text-sm font-semibold text-status-repair">{data.vehicles.inRepair}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ใกล้ถึงกำหนด</span>
            <span className="text-sm font-semibold text-status-due">{data.vehicles.dueSoon}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">เกินกำหนด</span>
            <span className="text-sm font-semibold text-status-overdue">{data.vehicles.overdue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
