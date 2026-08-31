"use client"

import { useEffect, useState } from "react"
import { Bell, Info, AlertTriangle, CheckCircle, Clock, Package, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

const typeMeta: Record<string, { icon: React.ElementType; className: string }> = {
  info: { icon: Info, className: "text-info bg-info/10" },
  warning: { icon: AlertTriangle, className: "text-status-due bg-status-due/10" },
  success: { icon: CheckCircle, className: "text-success bg-success/10" },
  urgent: { icon: AlertTriangle, className: "text-destructive bg-destructive/10" },
  low_stock: { icon: AlertTriangle, className: "text-status-due bg-status-due/10" },
  out_of_stock: { icon: Package, className: "text-destructive bg-destructive/10" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}

interface LowStockPart {
  id: string
  name: string
  partNumber: string
  category: string
  stockQuantity: number
  minimumQuantity: number
  unitMeasure: string
  status: "low_stock" | "out_of_stock"
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [lowStockParts, setLowStockParts] = useState<LowStockPart[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "low_stock">("all")

  useEffect(() => {
    Promise.all([
      fetch("/api/notifications").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/parts/alerts").then((r) => (r.ok ? r.json() : { lowStock: [] })),
    ])
      .then(([notifData, alertData]) => {
        setNotifications(Array.isArray(notifData) ? notifData : [])
        setLowStockParts(alertData.lowStock ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const partsAsNotifications = lowStockParts.map((p) => ({
    id: `stock-${p.id}`,
    title: p.status === "out_of_stock"
      ? `❌ ${p.name} - หมด stock`
      : `⚠️ ${p.name} - stock ใกล้หมด`,
    message: `คงเหลือ ${p.stockQuantity} ${p.unitMeasure} (ขั้นต่ำ ${p.minimumQuantity} ${p.unitMeasure}) | หมวด: ${p.category}`,
    type: p.status === "out_of_stock" ? "out_of_stock" : "low_stock",
    read: false,
    createdAt: new Date().toISOString(),
    isStockAlert: true,
    partId: p.id,
  }))

  const allItems = tab === "low_stock"
    ? partsAsNotifications
    : [...notifications, ...partsAsNotifications]

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">การแจ้งเตือน</h2>
          <p className="text-sm text-muted-foreground">
            {notifications.length} รายการทั่วไป | {lowStockParts.length} รายการอะไหล่
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab("all")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            tab === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          ทั้งหมด ({notifications.length + lowStockParts.length})
        </button>
        <button
          onClick={() => setTab("low_stock")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            tab === "low_stock"
              ? "bg-status-due text-white"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-1.5">
            <Package className="size-3.5" />
            อะไหล่คงเหลือ ({lowStockParts.length})
          </span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-4 w-48 rounded bg-muted mb-2" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bell className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {tab === "low_stock" ? "ไม่มีแจ้งเตือนอะไหล่คงเหลือ" : "ไม่มีการแจ้งเตือน"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map((n) => {
            const meta = typeMeta[n.type] ?? typeMeta.info
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow",
                  !n.read && "border-l-2 border-l-info",
                  n.isStockAlert && "border-l-2 border-l-status-due"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.className)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                      {n.isStockAlert && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <Link2 className="size-2.5" />
                          เชื่อมกับคลังอะไหล่
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
