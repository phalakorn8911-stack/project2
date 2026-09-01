"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Plus, Pencil, Trash2, X, Save, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface Driver {
  id: string
  rank: string
  firstName: string
  lastName: string
  photoUrl: string | null
  vehicles: { id: string; registrationNumber: string; brand: string; model: string }[]
}

const emptyForm = { rank: "", firstName: "", lastName: "" }

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDrivers()
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const fetchDrivers = () => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((data) => { setDrivers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const filtered = drivers.filter(
    (d) =>
      `${d.rank} ${d.firstName} ${d.lastName}`.includes(search) ||
      d.vehicles.some((v) => v.registrationNumber.includes(search))
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      let driverId = editingId
      if (editingId) {
        await fetch(`/api/drivers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        const res = await fetch("/api/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        driverId = data.id
      }

      if (photoFile && driverId) {
        const formData = new FormData()
        formData.append("file", photoFile)
        formData.append("driverId", driverId)
        await fetch("/api/upload-driver-photo", {
          method: "POST",
          body: formData,
        })
      }

      fetchDrivers()
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (d: Driver) => {
    setEditingId(d.id)
    setForm({ rank: d.rank, firstName: d.firstName, lastName: d.lastName })
    setPhotoFile(null)
    setPhotoPreview(d.photoUrl ?? null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบคนขับรถนี้?")) return
    try {
      await fetch(`/api/drivers/${id}`, { method: "DELETE" })
      fetchDrivers()
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  const handleDeletePhoto = async () => {
    if (!editingId) return
    try {
      await fetch(`/api/upload-driver-photo?driverId=${editingId}`, { method: "DELETE" })
      setPhotoFile(null)
      setPhotoPreview(null)
      fetchDrivers()
    } catch (err) {
      console.error("Delete photo error:", err)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">คนขับรถ</h2>
          <p className="text-sm text-muted-foreground">รายชื่อผู้รับผิดชอบยานพาหนะ {drivers.length} คน</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setPhotoFile(null); setPhotoPreview(null) }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          เพิ่มคนขับ
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="ค้นหาชื่อ, ยศ, ทะเบียนรถ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-card-foreground">
              {editingId ? "แก้ไขข้อมูลคนขับรถ" : "เพิ่มคนขับรถใหม่"}
            </h3>
            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">ยศ</label>
              <input
                type="text"
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
                placeholder="เช่น สิบเอก, ร้อยตรี"
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">ชื่อ</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="ชื่อจริง"
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">นามสกุล</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="นามสกุล"
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">รูปภาพ</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Camera className="size-3.5" />
                  {photoPreview ? "เปลี่ยนรูป" : "เลือกรูป"}
                </button>
                {editingId && photoPreview && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    ลบรูป
                  </button>
                )}
              </div>
              {photoPreview && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="ตัวอย่างรูป"
                    className="size-10 rounded-full object-cover border border-border"
                  />
                  <span className="text-xs text-muted-foreground">ตัวอย่างรูป</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.rank || !form.firstName || !form.lastName}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity",
                (saving || !form.rank || !form.firstName || !form.lastName) && "opacity-50 pointer-events-none"
              )}
            >
              <Save className="size-3.5" />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">รูป</th>
                  <th className="px-4 py-3 font-medium">ยศ</th>
                  <th className="px-3 py-3 font-medium">ชื่อ-นามสกุล</th>
                  <th className="px-3 py-3 font-medium">รถที่รับผิดชอบ</th>
                  <th className="px-4 py-3 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        {d.photoUrl ? (
                          <img
                            src={d.photoUrl}
                            alt={`${d.firstName} ${d.lastName}`}
                            className="size-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                            <Camera className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">{d.rank}</td>
                      <td className="px-3 py-3 font-medium text-card-foreground">{d.firstName} {d.lastName}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {d.vehicles.length === 0 ? (
                          <span className="text-xs">ยังไม่มีรถมอบหมาย</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {d.vehicles.map((v) => (
                              <span key={v.id} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {v.registrationNumber}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(d)}
                            className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="แก้ไข"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
