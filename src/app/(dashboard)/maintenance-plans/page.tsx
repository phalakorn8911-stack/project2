"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck, Clock, AlertTriangle, Pencil, Trash2, X, Save } from "lucide-react"
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

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MaintenancePlan | null>(null)

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
                  </div>
                </>
              )}
            </div>
          ))}
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
