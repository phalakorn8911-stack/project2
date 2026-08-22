"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck, Clock, AlertTriangle, Pencil, Trash2, X, Save, Plus, Truck, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MaintenancePlan {
  id: string
  name: string
  vehicleType: string
  vehicleTypeId: string
  intervalMonths: number | null
  intervalHours: number | null
  intervalMileage: number | null
  totalVehicles: number
  dueSoon: number
  overdue: number
}

interface VehicleType {
  id: string
  name: string
}

interface Vehicle {
  id: string
  registrationNumber: string
  model: string
}

interface PlanSchedule {
  id: string
  vehicleId: string
  registrationNumber: string
  model: string
  vehicleType: string
  lastPerformedDate: string | null
  lastPerformedMileage: number | null
  nextDueDate: string | null
  nextDueMileage: number | null
  status: string
}

interface PlanForm {
  name: string
  vehicleTypeId: string
  intervalMonths: string
  intervalMileage: string
  intervalHours: string
}

const emptyForm: PlanForm = {
  name: "",
  vehicleTypeId: "",
  intervalMonths: "",
  intervalMileage: "",
  intervalHours: "",
}

const scheduleStatusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอดำเนินการ", className: "text-muted-foreground bg-muted" },
  DUE_SOON: { label: "ใกล้ถึงกำหนด", className: "text-status-due bg-status-due/10" },
  OVERDUE: { label: "เกินกำหนด", className: "text-status-overdue bg-status-overdue/10" },
  COMPLETED: { label: "เสร็จแล้ว", className: "text-success bg-success/10" },
}

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MaintenancePlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null)
  const [planSchedules, setPlanSchedules] = useState<PlanSchedule[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [addSaving, setAddSaving] = useState(false)

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/maintenance-plans")
      if (res.ok) {
        const data = await res.json()
        setPlans(data)
      }
    } catch (e) {
      console.error("Failed to fetch maintenance plans", e)
    }
  }

  const fetchVehicleTypes = async () => {
    try {
      const res = await fetch("/api/vehicle-types")
      if (res.ok) {
        const data = await res.json()
        setVehicleTypes(data)
      }
    } catch (e) {
      console.error("Failed to fetch vehicle types", e)
    }
  }

  useEffect(() => {
    Promise.all([fetchPlans(), fetchVehicleTypes()]).then(() => setLoading(false))
  }, [])

  const updateField = (field: keyof PlanForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (plan: MaintenancePlan) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      vehicleTypeId: plan.vehicleTypeId,
      intervalMonths: plan.intervalMonths?.toString() ?? "",
      intervalMileage: plan.intervalMileage?.toString() ?? "",
      intervalHours: plan.intervalHours?.toString() ?? "",
    })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const body = {
      name: form.name.trim(),
      vehicleTypeId: form.vehicleTypeId || null,
      intervalMonths: form.intervalMonths ? parseInt(form.intervalMonths) : null,
      intervalMileage: form.intervalMileage ? parseInt(form.intervalMileage) : null,
      intervalHours: form.intervalHours ? parseInt(form.intervalHours) : null,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/maintenance-plans/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) await fetchPlans()
      } else {
        const res = await fetch("/api/maintenance-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) await fetchPlans()
      }
      cancelForm()
    } catch (e) {
      console.error("Failed to save plan", e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/maintenance-plans/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } catch (e) {
      console.error("Failed to delete plan", e)
    }
  }

  const getVehicleTypeName = (id: string) => {
    return vehicleTypes.find((vt) => vt.id === id)?.name ?? ""
  }

  const fetchPlanSchedules = async (planId: string) => {
    setLoadingSchedules(true)
    try {
      const res = await fetch(`/api/maintenance-schedules?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setPlanSchedules(data)
      }
    } catch (e) {
      console.error("Failed to fetch schedules", e)
    } finally {
      setLoadingSchedules(false)
    }
  }

  const fetchAvailableVehicles = async (planId: string) => {
    try {
      const plan = plans.find((p) => p.id === planId)
      if (!plan) return
      const res = await fetch(`/api/vehicles`)
      if (res.ok) {
        const allVehicles = await res.json()
        const assignedIds = planSchedules.map((s) => s.vehicleId)
        setAvailableVehicles(allVehicles.filter((v: Vehicle) => !assignedIds.includes(v.id)))
      }
    } catch (e) {
      console.error("Failed to fetch vehicles", e)
    }
  }

  const handleAddVehicle = async () => {
    if (!selectedPlan || !selectedVehicleId) return
    setAddSaving(true)
    try {
      const res = await fetch("/api/maintenance-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, vehicleId: selectedVehicleId }),
      })
      if (res.ok) {
        setSelectedVehicleId("")
        setShowAddVehicle(false)
        fetchPlanSchedules(selectedPlan.id)
        fetchPlans()
      }
    } catch (e) {
      console.error("Failed to add vehicle", e)
    } finally {
      setAddSaving(false)
    }
  }

  const openPlanDetail = (plan: MaintenancePlan) => {
    setSelectedPlan(plan)
    fetchPlanSchedules(plan.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">แผนซ่อมบำรุง</h1>
          <p className="text-muted-foreground mt-1">จัดการแผนการซ่อมบำรุงยานพาหนะ</p>
        </div>
        {!showForm && (
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + เพิ่มแผน
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? "แก้ไขแผนซ่อมบำรุง" : "เพิ่มแผนซ่อมบำรุงใหม่"}
            </h2>
            <button onClick={cancelForm} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ชื่อแผน *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="กรอกชื่อแผน"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ประเภท vehicle</label>
              <select
                value={form.vehicleTypeId}
                onChange={(e) => updateField("vehicleTypeId", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">เลือกประเภท vehicle</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ระยะห่าง (เดือน)</label>
              <input
                type="number"
                min={0}
                value={form.intervalMonths}
                onChange={(e) => updateField("intervalMonths", e.target.value)}
                placeholder="เช่น 6"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ระยะห่าง (กม.)</label>
              <input
                type="number"
                min={0}
                value={form.intervalMileage}
                onChange={(e) => updateField("intervalMileage", e.target.value)}
                placeholder="เช่น 10000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ระยะห่าง (ชั่วโมง)</label>
              <input
                type="number"
                min={0}
                value={form.intervalHours}
                onChange={(e) => updateField("intervalHours", e.target.value)}
                placeholder="เช่น 500"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={cancelForm}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className={cn(
                "rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors",
                saving || !form.name.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
              )}
            >
              <Save className="inline h-4 w-4 mr-1" />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>ยังไม่มีแผนซ่อมบำรุง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm relative group"
            >
              {editingId !== plan.id && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditForm(plan)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(plan)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {editingId === plan.id ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">ชื่อแผน</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">ประเภท vehicle</label>
                    <select
                      value={form.vehicleTypeId}
                      onChange={(e) => updateField("vehicleTypeId", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">เลือกประเภท</option>
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">เดือน</label>
                      <input
                        type="number"
                        min={0}
                        value={form.intervalMonths}
                        onChange={(e) => updateField("intervalMonths", e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">กม.</label>
                      <input
                        type="number"
                        min={0}
                        value={form.intervalMileage}
                        onChange={(e) => updateField("intervalMileage", e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">ชม.</label>
                      <input
                        type="number"
                        min={0}
                        value={form.intervalHours}
                        onChange={(e) => updateField("intervalHours", e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={cancelForm}
                      className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-accent transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.name.trim()}
                      className={cn(
                        "rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground transition-colors",
                        saving || !form.name.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
                      )}
                    >
                      <Save className="inline h-3 w-3 mr-1" />
                      {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{plan.name}</h3>
                      {plan.vehicleType && (
                        <p className="text-sm text-muted-foreground truncate">{plan.vehicleType}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.intervalMonths != null && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>ทุก {plan.intervalMonths} เดือน</span>
                      </div>
                    )}
                    {plan.intervalMileage != null && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>ทุก {plan.intervalMileage.toLocaleString()} กม.</span>
                      </div>
                    )}
                    {plan.intervalHours != null && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>ทุก {plan.intervalHours} ชม.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t border-border text-sm">
                    <div>
                      <span className="text-muted-foreground">รถทั้งหมด </span>
                      <span className="font-medium">{plan.totalVehicles}</span>
                    </div>
                    {plan.dueSoon > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="font-medium">{plan.dueSoon}</span>
                        <span>ใกล้ถึงกำหนด</span>
                      </div>
                    )}
                    {plan.overdue > 0 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="font-medium">{plan.overdue}</span>
                        <span>เกินกำหนด</span>
                      </div>
                    )}
                    <button
                      onClick={() => openPlanDetail(plan)}
                      className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      ดูรายละเอียด
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border border-border bg-card p-6 shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedPlan.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPlan.vehicleType}</p>
              </div>
              <button onClick={() => { setSelectedPlan(null); setShowAddVehicle(false); setAvailableVehicles([]) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">รถในแผน {planSchedules.length} คัน</p>
              <button
                onClick={() => { setShowAddVehicle(true); fetchAvailableVehicles(selectedPlan.id) }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="size-3" />
                เพิ่มรถ
              </button>
            </div>

            {showAddVehicle && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-muted/30">
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">-- เลือกรถ --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} - {v.model}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddVehicle}
                  disabled={!selectedVehicleId || addSaving}
                  className={cn("rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors", (!selectedVehicleId || addSaving) ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90")}
                >
                  {addSaving ? "กำลังเพิ่ม..." : "เพิ่ม"}
                </button>
                <button onClick={() => setShowAddVehicle(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {loadingSchedules ? (
              <p className="text-sm text-muted-foreground text-center py-8">กำลังโหลด...</p>
            ) : planSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีรถในแผนนี้</p>
            ) : (
              <div className="space-y-2">
                {planSchedules.map((s) => {
                  const st = scheduleStatusLabels[s.status] ?? scheduleStatusLabels.PENDING
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Truck className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.registrationNumber}</p>
                          <p className="text-xs text-muted-foreground">{s.model}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {s.lastPerformedDate && <p>ทำล่าสุด: {new Date(s.lastPerformedDate).toLocaleDateString("th-TH")}</p>}
                        {s.nextDueDate ? <p>รอบถัดไป: {new Date(s.nextDueDate).toLocaleDateString("th-TH")}</p> : <p>รอบถัดไป: ยังไม่กำหนด</p>}
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium mt-1", st.className)}>{st.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border border-border bg-card p-6 shadow-lg max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-destructive/10 p-2">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">ยืนยันการลบ</h3>
                <p className="text-sm text-muted-foreground">
                  ต้องการลบแผน &ldquo;{deleteTarget.name}&rdquo; ใช่หรือไม่?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
