"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Plus, X } from "lucide-react"

type WorkOrderStatus = "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED"

interface WorkOrder {
  id: string
  vehicleId: string
  woNumber: string
  vehicleRegistration: string
  issueDescription: string
  mechanicName: string
  urgency: string
  status: WorkOrderStatus
}

const statusConfig: Record<WorkOrderStatus, { label: string; color: string }> = {
  OPEN: { label: "รอรับงาน", color: "text-info bg-info/10" },
  IN_PROGRESS: { label: "กำลังซ่อม", color: "text-warning bg-warning/10" },
  WAITING_PARTS: { label: "รออะไหล่", color: "text-status-parts bg-status-parts/10" },
  COMPLETED: { label: "ซ่อมเสร็จ", color: "text-success bg-success/10" },
}

const statusOptions: { value: WorkOrderStatus; label: string }[] = [
  { value: "OPEN", label: "รอรับงานซ่อม" },
  { value: "IN_PROGRESS", label: "กำลังซ่อม" },
  { value: "WAITING_PARTS", label: "รออะไหล่" },
  { value: "COMPLETED", label: "ซ่อมเสร็จแล้ว" },
]

const columns: { key: WorkOrderStatus; title: string }[] = [
  { key: "OPEN", title: "รอรับงาน" },
  { key: "IN_PROGRESS", title: "กำลังซ่อม" },
  { key: "WAITING_PARTS", title: "รออะไหล่" },
  { key: "COMPLETED", title: "ซ่อมเสร็จ" },
]

const urgencyConfig: Record<string, { label: string; color: string }> = {
  EMERGENCY: { label: "ด่วนมาก", color: "bg-destructive text-destructive-foreground" },
  HIGH: { label: "สูง", color: "text-destructive bg-destructive/10" },
  MEDIUM: { label: "ปานกลาง", color: "text-warning bg-warning/10" },
  LOW: { label: "ปกติ", color: "text-muted-foreground bg-muted" },
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [mechanics, setMechanics] = useState<any[]>([])
  const [repairRequests, setRepairRequests] = useState<any[]>([])
  const [form, setForm] = useState({ vehicleId: "", supervisorId: "", repairRequestId: "" })
  const [saving, setSaving] = useState(false)

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch("/api/work-orders")
      const data = await res.json()
      setWorkOrders(data)
    } catch (error) {
      console.error("Failed to fetch work orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(Array.isArray(d) ? d : d.vehicles ?? [])).catch(() => {})
    fetch("/api/users").then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : d.users ?? []
      setMechanics(list.filter((u: any) => u.role === "mechanic"))
    }).catch(() => {})
    fetch("/api/repair-requests").then((r) => r.json()).then((d) => setRepairRequests(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!form.vehicleId || !form.supervisorId) return
    setSaving(true)
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ vehicleId: "", supervisorId: "", repairRequestId: "" })
        fetchWorkOrders()
      }
    } catch (error) {
      console.error("Create work order error:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, newStatus: WorkOrderStatus) => {
    try {
      await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchWorkOrders()
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setOpenDropdown(null)
    }
  }

  const getOrdersByStatus = (status: WorkOrderStatus) =>
    workOrders.filter((wo) => wo.status === status)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ใบงานซ่อม</h1>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="size-4" />
          สร้างใบสั่งซ่อม
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">สร้างใบสั่งซ่อมใหม่</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              <option value="">เลือกรถ</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationNumber} - {v.model}</option>)}
            </select>
            <select value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              <option value="">เลือกผู้ดูแล</option>
              {mechanics.map((m: any) => <option key={m.id} value={m.id}>{m.name ?? `${m.firstName} ${m.lastName}`}</option>)}
            </select>
            <select value={form.repairRequestId} onChange={(e) => setForm({ ...form, repairRequestId: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              <option value="">ใบแจ้งซ่อม (ถ้ามี)</option>
              {repairRequests.filter((r: any) => r.status === "PENDING").map((r: any) => <option key={r.id} value={r.id}>{r.requestNumber} - {r.symptoms?.substring(0, 30)}</option>)}
            </select>
            <button onClick={handleCreate} disabled={saving || !form.vehicleId || !form.supervisorId} className={cn("rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90", (saving || !form.vehicleId || !form.supervisorId) && "opacity-50 pointer-events-none")}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {getOrdersByStatus(col.key).length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {getOrdersByStatus(col.key).map((wo) => (
                  <div
                    key={wo.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{wo.woNumber}</span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenDropdown(openDropdown === wo.id ? null : wo.id)
                          }
                          className={cn(
                            "flex items-center gap-1 text-xs rounded-full px-2 py-1 cursor-pointer transition-colors",
                            statusConfig[wo.status].color,
                            "hover:opacity-80"
                          )}
                        >
                          {statusConfig[wo.status].label}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdown === wo.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover shadow-md">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateStatus(wo.id, opt.value)}
                                className={cn(
                                  "w-full text-left text-sm px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-lg last:rounded-b-lg",
                                  wo.status === opt.value && "font-semibold bg-accent"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {wo.vehicleRegistration}
                    </p>
                    <p className="text-sm mb-2">{wo.issueDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {wo.mechanicName}
                      </span>
                      <span
                        className={cn(
                          "text-xs rounded-full px-2 py-0.5",
                          urgencyConfig[wo.urgency]?.color || "text-muted-foreground bg-muted"
                        )}
                      >
                        {urgencyConfig[wo.urgency]?.label ?? wo.urgency}
                      </span>
                    </div>
                  </div>
                ))}
                {getOrdersByStatus(col.key).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">ไม่มีรายการ</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
