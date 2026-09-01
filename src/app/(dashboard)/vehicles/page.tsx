"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Plus, Filter, Truck, X, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const statusMeta: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "พร้อมใช้งาน", className: "text-status-available bg-status-available/10" },
  IN_USE: { label: "กำลังใช้งาน", className: "text-info bg-info/10" },
  DUE_SOON: { label: "ใกล้ถึงกำหนด", className: "text-status-due bg-status-due/10" },
  OVERDUE: { label: "เกินกำหนด", className: "text-status-overdue bg-status-overdue/10" },
  IN_REPAIR: { label: "กำลังซ่อม", className: "text-status-repair bg-status-repair/10" },
  WAITING_PARTS: { label: "รออะไหล่", className: "text-status-parts bg-status-parts/10" },
  OUT_OF_SERVICE: { label: "ใช้งานไม่ได้", className: "text-destructive bg-destructive/10" },
  RETIRED: { label: "ปลดประจำการ", className: "text-muted-foreground bg-muted" },
}

function VehiclesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get("status") || ""

  const [search, setSearch] = useState("")
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [form, setForm] = useState({
    registrationNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vehicleTypeId: "",
    unitId: "",
    fuelType: "Diesel",
    currentMileage: 0,
    status: "AVAILABLE",
  })
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setVehicles(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setVehicles([]); setLoading(false) })
  }, [])

  const openForm = async () => {
    setFormError("")
    setEditId(null)
    setForm({
      registrationNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      vehicleTypeId: "",
      unitId: "",
      fuelType: "Diesel",
      currentMileage: 0,
      status: "AVAILABLE",
    })
    const [vtRes, uRes] = await Promise.all([
      fetch("/api/vehicle-types").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/units").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
    setVehicleTypes(Array.isArray(vtRes) ? vtRes : [])
    setUnits(Array.isArray(uRes) ? uRes : [])
    if (Array.isArray(vtRes) && vtRes.length > 0) setForm((f) => ({ ...f, vehicleTypeId: vtRes[0].id }))
    if (Array.isArray(uRes) && uRes.length > 0) setForm((f) => ({ ...f, unitId: uRes[0].id }))
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setFormError("")
    try {
      const url = editId ? `/api/vehicles/${editId}` : "/api/vehicles"
      const method = editId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || "เกิดข้อผิดพลาด")
        setSaving(false)
        return
      }
      setShowForm(false)
      setEditId(null)
      const updated = await fetch("/api/vehicles").then((r) => (r.ok ? r.json() : [])).catch(() => [])
      setVehicles(Array.isArray(updated) ? updated : [])
    } catch {
      setFormError("เชื่อมต่อไม่ได้")
    }
    setSaving(false)
  }

  const openEdit = async (v: any) => {
    setFormError("")
    setEditId(v.id)
    setForm({
      registrationNumber: v.registrationNumber,
      brand: v.brand,
      model: v.model,
      year: v.year,
      vehicleTypeId: v.vehicleTypeId || "",
      unitId: v.unitId || "",
      fuelType: v.fuelType || "Diesel",
      currentMileage: v.currentMileage || 0,
      status: v.status,
    })
    const [vtRes, uRes] = await Promise.all([
      fetch("/api/vehicle-types").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/units").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
    setVehicleTypes(Array.isArray(vtRes) ? vtRes : [])
    setUnits(Array.isArray(uRes) ? uRes : [])
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบรถคันนี้? การลบไม่สามารถย้อนกลับได้")) return
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" })
      if (res.ok) {
        const updated = await fetch("/api/vehicles").then((r) => (r.ok ? r.json() : [])).catch(() => [])
        setVehicles(Array.isArray(updated) ? updated : [])
      }
    } catch {}
  }

  const filtered = vehicles.filter(
    (v) =>
      (!statusFilter || v.status === statusFilter) &&
      (v.registrationNumber?.includes(search) ||
        v.model?.toLowerCase().includes(search.toLowerCase()) ||
        v.brand?.toLowerCase().includes(search.toLowerCase())),
  )

  const clearFilter = () => {
    router.push("/vehicles")
  }

  const filterLabel = statusFilter ? statusMeta[statusFilter]?.label ?? statusFilter : ""

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ยานพาหนะ</h2>
          <p className="text-sm text-muted-foreground">
            {statusFilter ? `กรองโดย: ${filterLabel} (${filtered.length} คัน)` : `รายการยานพาหนะทั้งหมด ${vehicles.length} คัน`}
          </p>
        </div>
        <button onClick={openForm} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="size-4" />
          เพิ่มยานพาหนะ
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="ค้นหาทะเบียน, รุ่น, ยี่ห้อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
        {statusFilter && (
          <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm text-primary">
            <Filter className="size-4" />
            {filterLabel}
            <button onClick={clearFilter} className="ml-1 hover:text-primary/80">
              <X className="size-3" />
            </button>
          </div>
        )}
        <select
          value={statusFilter}
          onChange={(e) => {
            if (e.target.value) {
              router.push(`/vehicles?status=${e.target.value}`)
            } else {
              router.push("/vehicles")
            }
          }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(statusMeta).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">รูป</th>
                <th className="px-4 py-3 font-medium">ทะเบียน</th>
                <th className="px-3 py-3 font-medium">รุ่น</th>
                <th className="px-3 py-3 font-medium">ปี</th>
                <th className="px-3 py-3 font-medium">ประเภท</th>
                <th className="px-3 py-3 font-medium">หน่วยงาน</th>
                <th className="px-3 py-3 font-medium">เลขไมล์</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-3 py-3 font-medium text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const status = statusMeta[v.status] ?? { label: v.status, className: "text-muted-foreground bg-muted" }
                return (
                  <tr key={v.id} onClick={() => router.push(`/vehicles/${v.id}`)} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt={v.registrationNumber} className="size-10 rounded-lg object-cover" />
                      ) : (
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Truck className="size-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{v.registrationNumber}</td>
                    <td className="px-3 py-3 text-card-foreground">{v.brand} {v.model}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.year}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.type}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.unit}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.mileage}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(v)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-info/10 hover:text-info transition-colors" title="แก้ไข">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="ลบ">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">{editId ? "แก้ไขยานพาหนะ" : "เพิ่มยานพาหนะ"}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-card-foreground mb-1">ทะเบียน *</label>
                <input type="text" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="เช่น พล-0049" />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">ยี่ห้อ *</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="เช่น REO" />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">รุ่น *</label>
                <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="เช่น M35" />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">ปี *</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">เชื้อเพลิง</label>
                <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="Diesel">ดีเซล</option>
                  <option value="Gasoline">เบนซิน</option>
                  <option value="Electric">ไฟฟ้า</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">ประเภทรถ *</label>
                <select value={form.vehicleTypeId} onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>{vt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">หน่วย *</label>
                <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">เลขไมล์</label>
                <input type="number" value={form.currentMileage} onChange={(e) => setForm({ ...form, currentMileage: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">สถานะ</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  {Object.entries(statusMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-input text-sm hover:bg-muted transition-colors">ยกเลิก</button>
              <button onClick={handleSubmit} disabled={saving || !form.registrationNumber || !form.brand || !form.model} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-6"><div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div></div>}>
      <VehiclesContent />
    </Suspense>
  )
}
