"use client"

import { useEffect, useState } from "react"
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const typeMeta: Record<string, { icon: React.ElementType; className: string }> = {
  info: { icon: Info, className: "text-info bg-info/10" },
  warning: { icon: AlertTriangle, className: "text-status-due bg-status-due/10" },
  success: { icon: CheckCircle, className: "text-success bg-success/10" },
  urgent: { icon: AlertTriangle, className: "text-destructive bg-destructive/10" },
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { setNotifications(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">การแจ้งเตือน</h2>
          <p className="text-sm text-muted-foreground">{notifications.length} รายการ</p>
        </div>
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
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bell className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const meta = typeMeta[n.type] ?? typeMeta.info
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow",
                  !n.read && "border-l-2 border-l-info"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.className)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">{n.title}</p>
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
