"use client"

import { Bot, Sparkles } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function AiSummary() {
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/dashboard")
      const data = await res.json()

      const v = data.vehicles
      const wo = data.workOrders
      const pct = v.total > 0 ? ((v.available / v.total) * 100).toFixed(1) : "0"
      const totalWo = wo.open + wo.inProgress + wo.waitingParts + wo.completed

      const lines: string[] = []

      lines.push(
        `ขณะนี้มียานพาหนะทั้งหมด ${v.total} คัน พร้อมใช้งาน ${v.available} คัน (${pct}%)`,
      )
      if (v.inRepair > 0) lines.push(`กำลังซ่อม ${v.inRepair} คัน`)
      if (v.waitingParts > 0) lines.push(`รออะไหล่ ${v.waitingParts} คัน`)
      if (v.overdue > 0) lines.push(`เกินกำหนดซ่อม ${v.overdue} คัน`)
      if (v.dueSoon > 0) lines.push(`ใกล้ถึงกำหนดซ่อม ${v.dueSoon} คัน`)

      if (totalWo > 0) {
        lines.push(
          `ใบงานทั้งหมด ${totalWo} รายการ: เปิด ${wo.open} กำลังดำเนินการ ${wo.inProgress} รออะไหล่ ${wo.waitingParts} เสร็จแล้ว ${wo.completed}`,
        )
      }

      if (data.pendingRepairs > 0) {
        lines.push(`ใบแจ้งซ่อมค้างดำเนินการ ${data.pendingRepairs} รายการ`)
      }
      if (data.overdueSchedules > 0) {
        lines.push(`แผนซ่อมบำรุงเกินกำหนด ${data.overdueSchedules} รายการ`)
      }
      if (data.dueSoonSchedules > 0) {
        lines.push(`แผนซ่อมบำรุงใกล้ถึงกำหนด ${data.dueSoonSchedules} รายการ`)
      }
      if (data.lowStockCount > 0) {
        lines.push(`อะไหล่ใกล้หมด ${data.lowStockCount} รายการ ต้องสั่งซื้อ`)
      }
      if (data.monthlyCost > 0) {
        lines.push(`ค่าอะไหล่สะสม ${data.monthlyCost.toLocaleString()} บาท`)
      }

      const readyPct = parseFloat(pct)
      if (readyPct >= 80) {
        lines.push("แนวโน้มโดยรวมอยู่ในเกณฑ์ดี สามารถปฏิบัติงานได้ตามแผน")
      } else if (readyPct >= 60) {
        lines.push("แนวโน้มโดยรวมอยู่ในเกณฑ์ปานกลาง ควรเร่งดำเนินการซ่อมบำรุง")
      } else {
        lines.push("⚠ แนวโน้มโดยรวมน่ากังวล ควรพิจารณาจัดสรรทรัพยากรเพิ่มเติม")
      }

      setSummary(lines.join(" "))
    } catch {
      setSummary("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง")
    }
    setGenerating(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">สรุปภาพรวมโดย AI</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              วิเคราะห์ข้อมูลจากฐานข้อมูลจริงและสรุปสถานการณ์ปัจจุบัน
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all",
            generating
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-info text-info-foreground hover:opacity-90 active:scale-[0.97]",
          )}
        >
          <Sparkles className={cn("size-3.5", generating && "animate-pulse")} />
          {generating ? "กำลังวิเคราะห์..." : "ให้ AI สรุป"}
        </button>
      </div>

      {summary && (
        <div className="mt-4 rounded-lg bg-muted/60 p-4 text-sm text-card-foreground leading-relaxed">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-3.5 text-info" />
            <span className="text-xs font-medium text-info">AI Analysis</span>
          </div>
          {summary}
        </div>
      )}
    </div>
  )
}
