"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { ChevronDown, Plus, X, Pencil, Trash2, Wrench, Package } from "lucide-react"

type WorkOrderStatus = "OPEN" | "PENDING_APPROVAL" | "ASSIGNED" | "DIAGNOSING" | "IN_PROGRESS" | "WAITING_PARTS" | "READY_FOR_QC" | "COMPLETED" | "CLOSED" | "CANCELLED"

interface WorkOrder {
  id: string
  vehicleId: string
  woNumber: string
  vehicleRegistration: string
  issueDescription: string
  symptoms: string
  diagnosis: string
  mechanicName: string
  mechanicPhotoUrl: string | null
  urgency: string
  status: WorkOrderStatus
  mechanicId: string | null
}

interface RepairTask {
  id: string
  taskDescription: string
  laborHours: number
  cost: number
}

interface UsedPart {
  id: string
  partId: string
  partNumber: string
  partName: string
  unitMeasure: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

const statusConfig: Record<WorkOrderStatus, { label: string; color: string }> = {
  OPEN: { label: "รับงาน", color: "text-info bg-info/10" },
  PENDING_APPROVAL: { label: "รออนุมัติ", color: "text-status-due bg-status-due/10" },
  ASSIGNED: { label: "มอบหมายแล้ว", color: "text-info bg-info/10" },
  DIAGNOSING: { label: "กำลังตรวจ", color: "text-info bg-info/10" },
  IN_PROGRESS: { label: "กำลังซ่อม", color: "text-warning bg-warning/10" },
  WAITING_PARTS: { label: "รออะไหล่", color: "text-status-parts bg-status-parts/10" },
  READY_FOR_QC: { label: "รอตรวจงาน", color: "text-status-due bg-status-due/10" },
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
  { value: "READY_FOR_QC", label: "รอตรวจงาน" },
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
  const { data: session } = useSession()
  const myId = (session?.user as any)?.id as string | undefined
  const myRole = (session?.user as any)?.role as string | undefined
  const canManage = myRole === "admin" || myRole === "mechanic"
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [mineOnly, setMineOnly] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [mechanics, setMechanics] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [repairRequests, setRepairRequests] = useState<any[]>([])
  const [form, setForm] = useState({ vehicleId: "", supervisorId: "", repairRequestId: "", symptoms: "" })
  const [saving, setSaving] = useState(false)
  const [editWO, setEditWO] = useState<WorkOrder | null>(null)
  const [editForm, setEditForm] = useState({ mechanicId: "", supervisorId: "", woNumber: "", symptoms: "", diagnosis: "" })

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
    fetch("/api/vehicles").then((r) => (r.ok ? r.json() : [])).then((d) => setVehicles(Array.isArray(d) ? d : d.vehicles ?? [])).catch(() => setVehicles([]))
    fetch("/api/users").then((r) => (r.ok ? r.json() : [])).then((d) => {
      const list = Array.isArray(d) ? d : d.users ?? []
      setMechanics(list.filter((u: any) => u.role === "mechanic"))
      setSupervisors(list.filter((u: any) => u.role === "admin" || u.role === "mechanic"))
    }).catch(() => {})
    fetch("/api/repair-requests").then((r) => (r.ok ? r.json() : [])).then((d) => setRepairRequests(Array.isArray(d) ? d : [])).catch(() => setRepairRequests([]))
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
        setForm({ vehicleId: "", supervisorId: "", repairRequestId: "", symptoms: "" })
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

  // ---- ช่างรับงาน ----
  const [accepting, setAccepting] = useState<string | null>(null)
  const handleAccept = async (id: string) => {
    setAccepting(id)
    try {
      const res = await fetch(`/api/work-orders/${id}/accept`, { method: "POST" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error ?? "รับงานไม่สำเร็จ")
      }
      await fetchWorkOrders()
    } catch (error) {
      console.error("Accept work order error:", error)
    } finally {
      setAccepting(null)
    }
  }

  // ---- บันทึกซ่อม (tasks + เบิกอะไหล่) ----
  const [detailWO, setDetailWO] = useState<WorkOrder | null>(null)
  const [tasks, setTasks] = useState<RepairTask[]>([])
  const [usedParts, setUsedParts] = useState<UsedPart[]>([])
  const [partsCatalog, setPartsCatalog] = useState<any[]>([])
  const [taskForm, setTaskForm] = useState({ desc: "", hours: "", cost: "" })
  const [issueForm, setIssueForm] = useState({ partId: "", qty: "1" })
  const [detailSaving, setDetailSaving] = useState(false)

  const openDetail = async (wo: WorkOrder) => {
    setDetailWO(wo)
    setTasks([])
    setUsedParts([])
    try {
      const [tRes, pRes, cRes] = await Promise.all([
        fetch(`/api/work-orders/${wo.id}/tasks`),
        fetch(`/api/work-orders/${wo.id}/parts`),
        partsCatalog.length ? null : fetch("/api/parts"),
      ])
      if (tRes.ok) setTasks(await tRes.json())
      if (pRes.ok) setUsedParts(await pRes.json())
      if (cRes && cRes.ok) {
        const cd = await cRes.json()
        setPartsCatalog(Array.isArray(cd) ? cd : cd.parts ?? [])
      }
    } catch (error) {
      console.error("Load detail error:", error)
    }
  }

  const refreshDetail = async (woId: string) => {
    const [tRes, pRes] = await Promise.all([
      fetch(`/api/work-orders/${woId}/tasks`),
      fetch(`/api/work-orders/${woId}/parts`),
    ])
    if (tRes.ok) setTasks(await tRes.json())
    if (pRes.ok) setUsedParts(await pRes.json())
    fetchWorkOrders()
  }

  const handleAddTask = async () => {
    if (!detailWO || !taskForm.desc.trim()) return
    setDetailSaving(true)
    try {
      const res = await fetch(`/api/work-orders/${detailWO.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskDescription: taskForm.desc,
          laborHours: Number(taskForm.hours) || 0,
          cost: Number(taskForm.cost) || 0,
        }),
      })
      if (res.ok) {
        setTaskForm({ desc: "", hours: "", cost: "" })
        await refreshDetail(detailWO.id)
      }
    } finally {
      setDetailSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!detailWO || !confirm("ลบรายการนี้?")) return
    await fetch(`/api/work-orders/${detailWO.id}/tasks/${taskId}`, { method: "DELETE" })
    await refreshDetail(detailWO.id)
  }

  const handleIssuePart = async () => {
    if (!detailWO || !issueForm.partId) return
    setDetailSaving(true)
    try {
      const res = await fetch(`/api/work-orders/${detailWO.id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId: issueForm.partId, quantity: Number(issueForm.qty) || 0 }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error ?? "เบิกอะไหล่ไม่สำเร็จ")
      } else {
        setIssueForm({ partId: "", qty: "1" })
        await refreshDetail(detailWO.id)
      }
    } finally {
      setDetailSaving(false)
    }
  }

  const handleReturnPart = async (rowId: string) => {
    if (!detailWO || !confirm("คืนอะไหล่นี้เข้าสต็อก?")) return
    await fetch(`/api/work-orders/${detailWO.id}/parts/${rowId}`, { method: "DELETE" })
    await refreshDetail(detailWO.id)
  }

  const openEdit = (wo: WorkOrder) => {
    setEditWO(wo)
    setEditForm({
      mechanicId: "",
      supervisorId: "",
      woNumber: wo.woNumber,
      symptoms: wo.symptoms || "",
      diagnosis: wo.diagnosis || "",
    })
  }

  const handleUpdate = async () => {
    if (!editWO) return
    setSaving(true)
    try {
      const body: any = {}
      if (editForm.mechanicId) body.mechanicId = editForm.mechanicId
      if (editForm.supervisorId) body.supervisorId = editForm.supervisorId
      if (editForm.woNumber !== editWO.woNumber) body.woNumber = editForm.woNumber
      body.symptoms = editForm.symptoms
      body.diagnosis = editForm.diagnosis
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
    workOrders.filter((wo) => statuses.includes(wo.status) && (!mineOnly || (myId && wo.mechanicId === myId)))

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ใบงานซ่อม</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMineOnly(!mineOnly)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              mineOnly ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"
            )}
          >
            งานของฉัน
          </button>
          {canManage && (
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="size-4" />
            สร้างใบสั่งซ่อม
          </button>
          )}
        </div>
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
              {supervisors.map((m: any) => <option key={m.id} value={m.id}>{m.name ?? `${m.firstName} ${m.lastName}`}</option>)}
            </select>
            <select value={form.repairRequestId} onChange={(e) => setForm({ ...form, repairRequestId: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              <option value="">ใบแจ้งซ่อม (ถ้ามี)</option>
              {repairRequests.filter((r: any) => r.status === "PENDING").map((r: any) => <option key={r.id} value={r.id}>{r.requestNumber} - {r.symptoms?.substring(0, 30)}</option>)}
            </select>
            <button onClick={handleCreate} disabled={saving || !form.vehicleId || !form.supervisorId} className={cn("rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90", (saving || !form.vehicleId || !form.supervisorId) && "opacity-50 pointer-events-none")}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
          <textarea
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            placeholder="อธิบายอาการเสียของยานพาหนะ (เช่น เครื่องยนต์สตาร์ทไม่ติด, เบรกไม่อยู่, มีเสียงผิดปกติ...)"
            rows={2}
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
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
                        {canManage && (wo.status === "OPEN" || wo.status === "ASSIGNED") && (
                          <button
                            onClick={() => handleAccept(wo.id)}
                            disabled={accepting === wo.id}
                            className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            title="รับงานนี้"
                          >
                            {accepting === wo.id ? "..." : "รับงาน"}
                          </button>
                        )}
                        {canManage && (
                        <button onClick={() => openDetail(wo)} className="p-1 text-muted-foreground hover:text-info transition-colors" title="บันทึกซ่อม / เบิกอะไหล่">
                          <Wrench className="size-3" />
                        </button>
                        )}
                        {canManage && (
                        <button onClick={() => openEdit(wo)} className="p-1 text-muted-foreground hover:text-info transition-colors" title="แก้ไข">
                          <Pencil className="size-3" />
                        </button>
                        )}
                        {canManage && (
                        <button onClick={() => handleDelete(wo.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="ลบ">
                          <Trash2 className="size-3" />
                        </button>
                        )}
                        <div className="relative">
                        {canManage ? (
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
                        ) : (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs rounded-full px-2 py-1",
                            statusConfig[wo.status].color
                          )}
                        >
                          {statusConfig[wo.status].label}
                        </span>
                        )}
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
                    {wo.symptoms && (
                      <div className="mb-2 rounded-lg bg-warning/10 border border-warning/20 px-2 py-1.5">
                        <p className="text-xs font-medium text-warning mb-0.5">อาการเสีย</p>
                        <p className="text-xs text-foreground">{wo.symptoms}</p>
                      </div>
                    )}
                    {wo.diagnosis && (
                      <div className="mb-2 rounded-lg bg-info/10 border border-info/20 px-2 py-1.5">
                        <p className="text-xs font-medium text-info mb-0.5">ผลวินิจฉัย</p>
                        <p className="text-xs text-foreground">{wo.diagnosis}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {wo.mechanicPhotoUrl ? (
                          <img src={wo.mechanicPhotoUrl} alt="" className="size-4 rounded-full object-cover" />
                        ) : null}
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
                <label className="block text-xs text-muted-foreground mb-1">หมายเลขใบงาน</label>
                <input
                  type="text"
                  value={editForm.woNumber}
                  onChange={(e) => setEditForm({ ...editForm, woNumber: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
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
                  {supervisors.map((m: any) => <option key={m.id} value={m.id}>{m.name ?? `${m.firstName} ${m.lastName}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">อาการเสีย (อิสระ)</label>
                <textarea
                  value={editForm.symptoms}
                  onChange={(e) => setEditForm({ ...editForm, symptoms: e.target.value })}
                  placeholder="อธิบายอาการเสียของยานพาหนะ..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ผลวินิจฉัย (อิสระ)</label>
                <textarea
                  value={editForm.diagnosis}
                  onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                  placeholder="ระบุผลวินิจฉัยและแนวทางการซ่อม..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
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

      {detailWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl mx-4 p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">บันทึกซ่อม {detailWO.woNumber} <span className="text-sm font-normal text-muted-foreground">({detailWO.vehicleRegistration})</span></h3>
              <button onClick={() => setDetailWO(null)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Wrench className="size-4" /> รายการซ่อม ({tasks.length}) · ค่าแรงรวม ฿{tasks.reduce((s, t) => s + Number(t.cost || 0), 0).toLocaleString()}</h4>
              <div className="space-y-2 mb-3">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{t.taskDescription}</p>
                      <p className="text-xs text-muted-foreground">{t.laborHours} ชม. · ฿{Number(t.cost).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteTask(t.id)} className="p-1 text-muted-foreground hover:text-destructive" title="ลบ"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-xs text-muted-foreground">ยังไม่มีรายการซ่อม</p>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input value={taskForm.desc} onChange={(e) => setTaskForm({ ...taskForm, desc: e.target.value })} placeholder="รายละเอียดงาน..." className="col-span-2 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                <input value={taskForm.hours} onChange={(e) => setTaskForm({ ...taskForm, hours: e.target.value })} placeholder="ชั่วโมง" type="number" min="0" className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                <input value={taskForm.cost} onChange={(e) => setTaskForm({ ...taskForm, cost: e.target.value })} placeholder="ค่าแรง (บาท)" type="number" min="0" className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <button onClick={handleAddTask} disabled={detailSaving || !taskForm.desc.trim()} className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {detailSaving ? "กำลังบันทึก..." : "เพิ่มรายการซ่อม"}
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Package className="size-4" /> อะไหล่ที่ใช้ ({usedParts.length}) · รวม ฿{usedParts.reduce((s, p) => s + Number(p.totalPrice || 0), 0).toLocaleString()}</h4>
              <div className="space-y-2 mb-3">
                {usedParts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.partName} <span className="text-xs text-muted-foreground">({p.partNumber})</span></p>
                      <p className="text-xs text-muted-foreground">{p.quantity} {p.unitMeasure} × ฿{Number(p.unitPrice).toLocaleString()} = ฿{Number(p.totalPrice).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleReturnPart(p.id)} className="p-1 text-muted-foreground hover:text-destructive" title="คืนสต็อก"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
                {usedParts.length === 0 && <p className="text-xs text-muted-foreground">ยังไม่มีการเบิกอะไหล่</p>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <select value={issueForm.partId} onChange={(e) => setIssueForm({ ...issueForm, partId: e.target.value })} className="col-span-2 md:col-span-1 rounded-lg border border-input bg-background px-2 py-2 text-sm">
                  <option value="">เลือกอะไหล่</option>
                  {partsCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name} (เหลือ {p.stockQuantity})</option>)}
                </select>
                <input value={issueForm.qty} onChange={(e) => setIssueForm({ ...issueForm, qty: e.target.value })} placeholder="จำนวน" type="number" min="1" className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                <button onClick={handleIssuePart} disabled={detailSaving || !issueForm.partId} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {detailSaving ? "..." : "เบิกอะไหล่"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
