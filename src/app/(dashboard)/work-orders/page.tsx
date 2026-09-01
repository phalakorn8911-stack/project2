"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Plus, X, Pencil, Trash2 } from "lucide-react"

type WorkOrderStatus = "OPEN" | "PENDING_APPROVAL" | "ASSIGNED" | "DIAGNOSING" | "IN_PROGRESS" | "WAITING_PARTS" | "READY_FOR_QC" | "COMPLETED" | "CLOSED" | "CANCELLED"

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
  OPEN: { label: "รับงาน", color: "text-info bg-info/10" },
  PENDING_APPROVAL: { label: "รออนุมัติ", color: "text-status-due bg-status-due/10" },
  ASSIGNED: { label: "มอบหมายแล้ว", color: "text-info bg-info/10" },
  DIAGNOSING: { label: "กำลังตรวจ", color: "text-info bg-info/10" },
  IN_PROGRESS: { label: "กำลังซ่อม", color: "text-warning bg-warning/10" },
  WAITING_PARTS: { label: "รออะไหล่", color: "text-status-parts bg-status-parts/10" },
  READY_FOR_QC: { label: "รอตรวจ QC", color: "text-status-due bg-status-due/10" },
  COMPLETED: { label: "ซ่อมเสร็จ", color: "text-success bg-success/10" },
  CLOSED: { label: "ปิดงาน", color: "text-muted-foreground bg-muted" },
  CANCELLED: { label: "ยกเลิก", color: "text-destructive bg-destructive/10" },
}

const statusOptions: { value: WorkOrderStatus; label: string }[] = [
  { value: "OPEN", label: "รับงานซ่อม" },
  { value: "PENDING_APPROVAL", label: "รออนุมัติ" },
  { value: "ASSIGNED", label: "มอบหมายแล้ว" },
  { value: "DIAGNOSING", label: "กำลังตรวจ" },
  { value: "IN_PROGRESS", label: "กำลังซ่อม" },
  { value: "WAITING_PARTS", label: "รออะไหล่" },
  { value: "READY_FOR_QC", label: "รอตรวจ QC" },
  { value: "COMPLETED", label: "ซ่อมเสร็จแล้ว" },
  { value: "CLOSED", label: "ปิดงาน" },
  { value: "CANCELLED", label: "ยกเลิก" },
]

const columns: { key: string; title: string; statuses: WorkOrderStatus[] }[] = [
  { key: "pending", title: "รอดำเนินการ", statuses: ["OPEN", "PENDING_APPROVAL", "ASSIGNED", "DIAGNOSING"] },
  { key: "active", title: "กำลังดำเนินการ", statuses: ["IN_PROGRESS", "WAITING_PARTS", "READY_FOR_QC"] },
  { key: "done", title: "เสร็จสิ้น", statuses: ["COMPLETED", "CLOSED", "CANCELLED"] },
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
  const [editWO, setEditWO] = useState<WorkOrder | null>(null)
  const [editForm, setEditForm] = useState({ mechanicId: "", supervisorId: "" })

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch("/api/work-orders")
      if (!res.ok) {
        setWorkOrders([])
        return
      }
      const data = await res.json()
      setWorkOrders(Array.isArray(data) ? data : [])
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

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบใบงานซ่อมนี้?")) return
    try {
      const res = await fetch(`/api/work-orders/${id}`, { method: "DELETE" })
      if (res.ok) fetchWorkOrders()
    } catch (error) {
      console.error("Delete work order error:", error)
    }
  }

  const openEdit = (wo: WorkOrder) => {
    setEditWO(wo)
    setEditForm({
      mechanicId: "",
      supervisorId: "",
    })
  }

  const handleUpdate = async () => {
    if (!editWO) return
    setSaving(true)
    try {
      const body: any = {}
      if (editForm.mechanicId) body.mechanicId = editForm.mechanicId
      if (editForm.supervisorId) body.supervisorId = editForm.supervisorId
      await fetch(`/api/work-orders/${editWO.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setEditWO(null)
      fetchWorkOrders()
    } catch (error) {
      console.error("Update work order error:", error)
    } finally {
      setSaving(false)
    }
  }

  const getOrdersByStatuses = (statuses: WorkOrderStatus[]) =>
    workOrders.filter((wo) => statuses.includes(wo.status))

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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {getOrdersByStatuses(col.statuses).length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {getOrdersByStatuses(col.statuses).map((wo) => (
                  <div
                    key={wo.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{wo.woNumber}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(wo)} className="p-1 text-muted-foreground hover:text-info transition-colors" title="แก้ไข">
                          <Pencil className="size-3" />
                        </button>
                        <button onClick={() => handleDelete(wo.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="ลบ">
                          <Trash2 className="size-3" />
                        </button>
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
                {getOrdersByStatuses(col.statuses).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">ไม่มีรายการ</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">แก้ไขใบงาน {editWO.woNumber}</h3>
              <button onClick={() => setEditWO(null)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">มอบหมายช่าง</label>
                <select value={editForm.mechanicId} onChange={(e) => setEditForm({ ...editForm, mechanicId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">ไม่เปลี่ยน</option>
                  {mechanics.map((m: any) => <option key={m.id} value={m.id}>{m.name ?? `${m.firstName} ${m.lastName}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ผู้ดูแล</label>
                <select value={editForm.supervisorId} onChange={(e) => setEditForm({ ...editForm, supervisorId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">ไม่เปลี่ยน</option>
                  {mechanics.map((m: any) => <option key={m.id} value={m.id}>{m.name ?? `${m.firstName} ${m.lastName}`}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditWO(null)} className="px-4 py-2 rounded-lg border border-input text-sm hover:bg-muted transition-colors">ยกเลิก</button>
              <button onClick={handleUpdate} disabled={saving || (!editForm.mechanicId && !editForm.supervisorId)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
