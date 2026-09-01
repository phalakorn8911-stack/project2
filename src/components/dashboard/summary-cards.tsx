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
  bgColor: string
  href: string
}

export function SummaryCards({ data }: { data?: any }) {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!data?.vehicles || !data?.workOrders) { setLoading(false); return }
    setCards([
      { label: "รถทั้งหมด", value: String(data.vehicles.total), change: "", trend: "neutral", icon: Truck, color: "text-primary", bgColor: "bg-primary/10", href: "/vehicles" },
      { label: "พร้อมใช้งาน", value: String(data.vehicles.available), change: data.vehicles.total ? `${((data.vehicles.available / data.vehicles.total) * 100).toFixed(1)}%` : "0%", trend: "up", icon: CheckCircle, color: "text-success", bgColor: "bg-success/10", href: "/vehicles?status=AVAILABLE" },
      { label: "กำลังใช้งาน", value: String(data.vehicles.inUse), change: "", trend: "neutral", icon: Truck, color: "text-info", bgColor: "bg-info/10", href: "/vehicles?status=IN_USE" },
      { label: "กำลังซ่อม", value: String(data.vehicles.inRepair), change: "", trend: "neutral", icon: Wrench, color: "text-status-repair", bgColor: "bg-status-repair/10", href: "/vehicles?status=IN_REPAIR" },
      { label: "รออะไหล่", value: String(data.vehicles.waitingParts), change: "", trend: "neutral", icon: Package, color: "text-status-parts", bgColor: "bg-status-parts/10", href: "/vehicles?status=WAITING_PARTS" },
      { label: "ใกล้รอบซ่อม", value: String(data.vehicles.dueSoon), change: "", trend: "neutral", icon: Clock, color: "text-status-due", bgColor: "bg-status-due/10", href: "/vehicles?status=DUE_SOON" },
      { label: "เกินรอบซ่อม", value: String(data.vehicles.overdue), change: "", trend: "neutral", icon: AlertTriangle, color: "text-status-overdue", bgColor: "bg-status-overdue/10", href: "/vehicles?status=OVERDUE" },
      { label: "รออนุมัติ", value: String(data.pendingRepairs), change: "รอการดำเนินการ", trend: "neutral", icon: FileText, color: "text-info", bgColor: "bg-info/10", href: "/vehicles" },
      { label: "งานค้าง", value: String(data.workOrders.open), change: "", trend: "neutral", icon: Ban, color: "text-destructive", bgColor: "bg-destructive/10", href: "/work-orders" },
      { label: "ค่าอะไหล่สะสม", value: `฿${(data.totalPartsCost / 1000).toFixed(0)}K`, change: "", trend: "neutral", icon: DollarSign, color: "text-accent", bgColor: "bg-accent/10", href: "/parts" },
      { label: "อะไหล่ใกล้หมด", value: String(data.lowStockCount), change: "ต้องสั่งเพิ่ม", trend: "neutral", icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", href: "/parts" },
    ])
    setLoading(false)
  }, [data])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-muted mb-3" />
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
          className="rounded-lg border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all text-left cursor-pointer group"
        >
          <div className={cn("flex items-center justify-center size-9 rounded-lg mb-3", card.bgColor)}>
            <card.icon className={cn("size-5", card.color)} />
          </div>
          <p className="text-2xl font-bold text-card-foreground tracking-tight">{card.value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
          {card.change && <p className="text-xs text-muted-foreground mt-1 font-medium">{card.change}</p>}
        </button>
      ))}
    </div>
  )
}
