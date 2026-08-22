"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Truck, Wrench, Package, AlertTriangle, Clock, CheckCircle, DollarSign, FileText, Ban } from "lucide-react"
import { cn } from "@/lib/utils"

type CardData = {
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ElementType
  color: string
  href: string
}

const iconMap = { Truck, Wrench, Package, AlertTriangle, Clock, CheckCircle, DollarSign, FileText, Ban }

export function SummaryCards() {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setCards([
          { label: "รถทั้งหมด", value: String(d.vehicles.total), change: "", trend: "neutral", icon: Truck, color: "text-foreground", href: "/vehicles" },
          { label: "พร้อมใช้งาน", value: String(d.vehicles.available), change: d.vehicles.total ? `${((d.vehicles.available / d.vehicles.total) * 100).toFixed(1)}%` : "0%", trend: "up", icon: CheckCircle, color: "text-success", href: "/vehicles?status=AVAILABLE" },
          { label: "กำลังซ่อม", value: String(d.vehicles.inRepair), change: "", trend: "neutral", icon: Wrench, color: "text-status-repair", href: "/vehicles?status=IN_REPAIR" },
          { label: "รออะไหล่", value: String(d.vehicles.waitingParts), change: "", trend: "neutral", icon: Package, color: "text-status-parts", href: "/vehicles?status=WAITING_PARTS" },
          { label: "ใกล้รอบซ่อม", value: String(d.dueSoonSchedules), change: "ภายใน 30 วัน", trend: "neutral", icon: Clock, color: "text-status-due", href: "/maintenance-plans" },
          { label: "เกินรอบซ่อม", value: String(d.overdueSchedules), change: "", trend: "neutral", icon: AlertTriangle, color: "text-status-overdue", href: "/maintenance-plans" },
          { label: "รออนุมัติ", value: String(d.pendingRepairs), change: "รอการดำเนินการ", trend: "neutral", icon: FileText, color: "text-info", href: "/vehicles" },
          { label: "งานซ่อมค้าง", value: String(d.workOrders.inProgress), change: "", trend: "neutral", icon: Ban, color: "text-destructive", href: "/vehicles?status=IN_REPAIR" },
          { label: "ค่าอะไหล่สะสม", value: `฿${(d.monthlyCost / 1000).toFixed(0)}K`, change: "", trend: "neutral", icon: DollarSign, color: "text-foreground", href: "/parts" },
          { label: "อะไหล่ใกล้หมด", value: String(d.lowStockCount), change: "ต้องสั่งเพิ่ม", trend: "neutral", icon: AlertTriangle, color: "text-destructive", href: "/parts" },
        ])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
            <div className="h-5 w-5 rounded bg-muted mb-3" />
            <div className="h-7 w-16 rounded bg-muted mb-1" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => router.push(card.href)}
          className="rounded-xl border border-border bg-card p-4 hover:shadow-sm hover:border-primary/50 transition-all text-left cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <card.icon className={cn("size-5", card.color)} />
          </div>
          <p className="text-2xl font-semibold text-card-foreground tracking-tight">{card.value}</p>
          <p className="text-sm text-card-foreground mt-0.5">{card.label}</p>
          {card.change && <p className="text-[11px] text-muted-foreground mt-1">{card.change}</p>}
        </button>
      ))}
    </div>
  )
}
