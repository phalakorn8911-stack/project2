"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Filter, Package } from "lucide-react"
import { cn } from "@/lib/utils"

export default function PartsPage() {
  const [search, setSearch] = useState("")
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/parts")
      .then((r) => r.json())
      .then((data) => { setParts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = parts.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">คลังอะไหล่</h2>
          <p className="text-sm text-muted-foreground">รายการอะไหล่และสินค้าคงคลัง ({parts.length} รายการ)</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="size-4" />
          เพิ่มอะไหล่
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="ค้นหาชื่อ, รหัส, หมวดหมู่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
          <Filter className="size-4" />
          หมวดหมู่
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-9 w-9 rounded-lg bg-muted mb-3" />
              <div className="h-4 w-3/4 rounded bg-muted mb-1" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const isLow = p.stock <= p.min
            const isCritical = p.stock <= p.min / 2
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Package className="size-4" />
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                    isCritical ? "bg-destructive/10 text-destructive" : isLow ? "bg-status-parts/10 text-status-parts" : "bg-status-available/10 text-status-available",
                  )}>
                    {isCritical ? "วิกฤติ" : isLow ? "ใกล้หมด" : "ปกติ"}
                  </span>
                </div>
                <p className="text-sm font-medium text-card-foreground leading-tight mb-0.5">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.code}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">คงเหลือ</p>
                    <p className={cn("text-lg font-semibold", isCritical ? "text-destructive" : isLow ? "text-status-parts" : "text-card-foreground")}>
                      {p.stock}
                      <span className="text-sm font-normal text-muted-foreground">/{p.min}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">ราคา</p>
                    <p className="text-sm font-medium text-card-foreground">฿{p.price?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{p.category}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
