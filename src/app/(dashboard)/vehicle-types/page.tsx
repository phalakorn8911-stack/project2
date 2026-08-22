"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { cn } from "@/lib/utils"

const emptyForm = { name: "", description: "", fuelType: "", weight: "", seatingCapacity: "", engineSpec: "" }

type VehicleTypeRow = {
  id: string
  name: string
  description: string | null
  fuelType: string | null
  weight: string | null
  seatingCapacity: number | null
  engineSpec: string | null
}

export default function VehicleTypesPage() {
  const [rows, setRows] = useState<VehicleTypeRow[]>([])
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRows = async () => {
    setLoading(true)
    const res = await fetch("/api/vehicle-types")
    const data = await res.json()
    setRows(data)
    setLoading(false)
  }

  useEffect(() => { fetchRows() }, [])

  const filtered = rows.filter((r) =>
    [r.name, r.description, r.fuelType, r.weight, r.engineSpec, String(r.seatingCapacity)]
      .filter(Boolean)
      .some((f) => f!.toLowerCase().includes(search.toLowerCase()))
  )

  const toPayload = (form: typeof emptyForm) => ({
    name: form.name,
    description: form.description || null,
    fuelType: form.fuelType || null,
    weight: form.weight || null,
    seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : null,
    engineSpec: form.engineSpec || null,
  })

  const handleAdd = async () => {
    await fetch("/api/vehicle-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(addForm)),
    })
    setAddForm(emptyForm)
    setShowAdd(false)
    fetchRows()
  }

  const handleEdit = async (id: string) => {
    await fetch(`/api/vehicle-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    })
    setEditId(null)
    setEditForm(emptyForm)
    fetchRows()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/vehicle-types/${deleteId}`, { method: "DELETE" })
    setDeleteId(null)
    fetchRows()
  }

  const startEdit = (row: VehicleTypeRow) => {
    setEditId(row.id)
    setEditForm({
      name: row.name,
      description: row.description ?? "",
      fuelType: row.fuelType ?? "",
      weight: row.weight ?? "",
      seatingCapacity: row.seatingCapacity != null ? String(row.seatingCapacity) : "",
      engineSpec: row.engineSpec ?? "",
    })
  }

  const thClass = "px-4 py-3 text-left text-sm font-medium text-muted-foreground"
  const tdClass = "px-4 py-3 text-sm text-card-foreground"
  const inputClass = "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-card-foreground">จัดการประเภทรถ</h1>
          <p className="text-sm text-muted-foreground">ทั้งหมด {filtered.length} รายการ</p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> เพิ่มประเภท
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาประเภทรถ..."
          className="w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-card-foreground">เพิ่มประเภทรถใหม่</h2>
            <button onClick={() => { setShowAdd(false); setAddForm(emptyForm) }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">ชื่อประเภทรถ *</label>
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={cn(inputClass, "rounded-lg px-3 py-2 bg-muted")} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">เชื้อเพลิง</label>
              <input value={addForm.fuelType} onChange={(e) => setAddForm({ ...addForm, fuelType: e.target.value })} placeholder="Diesel, Gasoline..." className={cn(inputClass, "rounded-lg px-3 py-2 bg-muted")} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">น้ำหนัก</label>
              <input value={addForm.weight} onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })} placeholder="3,500 kg" className={cn(inputClass, "rounded-lg px-3 py-2 bg-muted")} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">ที่นั่ง</label>
              <input type="number" value={addForm.seatingCapacity} onChange={(e) => setAddForm({ ...addForm, seatingCapacity: e.target.value })} className={cn(inputClass, "rounded-lg px-3 py-2 bg-muted")} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">สเปคเครื่องยนต์</label>
              <input value={addForm.engineSpec} onChange={(e) => setAddForm({ ...addForm, engineSpec: e.target.value })} className={cn(inputClass, "rounded-lg px-3 py-2 bg-muted")} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1 block text-xs text-muted-foreground">รายละเอียด</label>
              <textarea value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} rows={2} className={cn(inputClass, "rounded-lg px-3 py-2 bg-muted resize-none")} />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); setAddForm(emptyForm) }} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              ยกเลิก
            </button>
            <button onClick={handleAdd} disabled={!addForm.name.trim()} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Save className="h-4 w-4" /> บันทึก
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>ชื่อประเภทรถ</th>
              <th className={thClass}>รายละเอียด</th>
              <th className={thClass}>เชื้อเพลิง</th>
              <th className={thClass}>น้ำหนัก</th>
              <th className={thClass}>ที่นั่ง</th>
              <th className={thClass}>สเปคเครื่องยนต์</th>
              <th className={cn(thClass, "text-right")}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}
                </td>
              </tr>
            )}
            {filtered.map((row) =>
              editId === row.id ? (
                <tr key={row.id} className="border-b border-border bg-muted/30">
                  <td className={tdClass}>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input value={editForm.fuelType} onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={editForm.seatingCapacity} onChange={(e) => setEditForm({ ...editForm, seatingCapacity: e.target.value })} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input value={editForm.engineSpec} onChange={(e) => setEditForm({ ...editForm, engineSpec: e.target.value })} className={inputClass} />
                  </td>
                  <td className={cn(tdClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(row.id)} disabled={!editForm.name.trim()} className="rounded p-1 text-primary hover:bg-muted disabled:opacity-50">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditId(null); setEditForm(emptyForm) }} className="rounded p-1 text-muted-foreground hover:bg-muted">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                  <td className={tdClass}>{row.name}</td>
                  <td className={tdClass}>{row.description ?? "-"}</td>
                  <td className={tdClass}>{row.fuelType ?? "-"}</td>
                  <td className={tdClass}>{row.weight ?? "-"}</td>
                  <td className={tdClass}>{row.seatingCapacity ?? "-"}</td>
                  <td className={tdClass}>{row.engineSpec ?? "-"}</td>
                  <td className={cn(tdClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(row)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(row.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-card-foreground">ยืนยันการลบ</h2>
            <p className="mt-2 text-sm text-muted-foreground">คุณต้องการลบประเภทรถนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
                ยกเลิก
              </button>
              <button onClick={handleDelete} className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
