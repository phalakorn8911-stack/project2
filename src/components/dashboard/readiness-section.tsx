"use client"

import { useEffect, useState } from "react"
import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type VehicleReadiness = {
  id: string
  registrationNumber: string
  brand: string
  model: string
  unit: string
  vehicleType: string
  status: string
  readiness: number
  overdueMaintenance: number
  dueSoonMaintenance: number
  mileage: number
}

type ReadinessData = {
  overall: number
  vehicles: VehicleReadiness[]
  summary: { total: number; excellent: number; good: number; fair: number; poor: number }
}

function getReadinessColor(pct: number): string {
  if (pct >= 90) return "text-success"
  if (pct >= 70) return "text-status-due"
  if (pct >= 50) return "text-status-repair"
  return "text-destructive"
}

function getReadinessBg(pct: number): string {
  if (pct >= 90) return "bg-success"
  if (pct >= 70) return "bg-status-due"
  if (pct >= 50) return "bg-status-repair"
  return "bg-destructive"
}

function getReadinessLabel(pct: number): string {
  if (pct >= 90) return "ดีเยี่ยม"
  if (pct >= 70) return "ดี"
  if (pct >= 50) return "พอใช้"
  return "ต่ำ"
}

function getReadinessIcon(pct: number) {
  if (pct >= 90) return TrendingUp
  if (pct >= 50) return Minus
  return TrendingDown
}

export function ReadinessSection() {
  const [data, setData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/readiness")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-5 w-48 rounded bg-muted mb-4" />
        <div className="h-32 rounded bg-muted/40" />
      </div>
    )
  }

  if (!data) return null

  const OverallIcon = getReadinessIcon(data.overall)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-info" />
          <h3 className="text-sm font-semibold text-card-foreground">ความพร้อมรบของยานพาหนะ</h3>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative size-20">
            <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--muted)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={data.overall >= 90 ? "var(--status-available)" : data.overall >= 70 ? "var(--status-due)" : data.overall >= 50 ? "var(--status-repair)" : "var(--destructive)"}
                strokeWidth="6"
                strokeDasharray={`${(data.overall / 100) * 213.6} 213.6`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-lg font-bold", getReadinessColor(data.overall))}>{data.overall}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">ความพร้อมเฉลี่ย</p>
            <p className={cn("text-xs font-medium", getReadinessColor(data.overall))}>{getReadinessLabel(data.overall)}</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-success/5">
            <p className="text-lg font-bold text-success">{data.summary.excellent}</p>
            <p className="text-[11px] text-muted-foreground">ดีเยี่ยม (≥90%)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-status-due/5">
            <p className="text-lg font-bold text-status-due">{data.summary.good}</p>
            <p className="text-[11px] text-muted-foreground">ดี (70-89%)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-status-repair/5">
            <p className="text-lg font-bold text-status-repair">{data.summary.fair}</p>
            <p className="text-[11px] text-muted-foreground">พอใช้ (50-69%)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/5">
            <p className="text-lg font-bold text-destructive">{data.summary.poor}</p>
            <p className="text-[11px] text-muted-foreground">ต่ำ (&lt;50%)</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-border text-left text-[11px] text-muted-foreground">
              <th className="pb-2 font-medium">ทะเบียน</th>
              <th className="pb-2 font-medium">รุ่น</th>
              <th className="pb-2 font-medium">หน่วย</th>
              <th className="pb-2 font-medium text-center">ไมล์</th>
              <th className="pb-2 font-medium text-center">ซ่อมเกิน</th>
              <th className="pb-2 font-medium text-center">ใกล้กำหนด</th>
              <th className="pb-2 font-medium text-center">ความพร้อม</th>
            </tr>
          </thead>
          <tbody className="border-t border-border">
            {data.vehicles.map((v) => {
              const ReadinessIcon = getReadinessIcon(v.readiness)
              return (
                <tr key={v.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2 font-medium text-card-foreground">{v.registrationNumber}</td>
                  <td className="py-2 text-muted-foreground text-[13px]">{v.model}</td>
                  <td className="py-2 text-muted-foreground text-[13px]">{v.unit}</td>
                  <td className="py-2 text-muted-foreground text-[13px] text-center">{v.mileage.toLocaleString()}</td>
                  <td className="py-2 text-center">
                    {v.overdueMaintenance > 0 ? (
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-destructive bg-destructive/10">
                        {v.overdueMaintenance}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {v.dueSoonMaintenance > 0 ? (
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-status-due bg-status-due/10">
                        {v.dueSoonMaintenance}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", getReadinessBg(v.readiness))} style={{ width: `${v.readiness}%` }} />
                      </div>
                      <span className={cn("text-xs font-semibold min-w-[32px] text-right", getReadinessColor(v.readiness))}>
                        {v.readiness}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
