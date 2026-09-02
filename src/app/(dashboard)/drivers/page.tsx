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

interface DriverReport {
  id: string
  driverId: string
  vehicleId: string
  registrationNumber: string
  model: string
  symptoms: string
  reportDate: string
}

const emptyForm = { rank: "", firstName: "", lastName: "" }

const months = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`
}

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
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [reports, setReports] = useState<DriverReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportForm, setReportForm] = useState({ vehicleId: "", symptoms: "", reportDate: "" })
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [reportSaving, setReportSaving] = useState(false)
  const [allVehicles, setAllVehicles] = useState<{ id: string; registrationNumber: string; model: string }[]>([])

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
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setDrivers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setDrivers([]); setLoading(false) })
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
        const res = await fetch(`/api/drivers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          alert(errData.error || "เกิดข้อผิดพลาดในการแก้ไข")
          return
        }
      } else {
        const res = await fetch("/api/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          alert(errData.error || "เกิดข้อผิดพลาดในการเพิ่มพลขับ")
          return
        }
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

  const fetchReports = async (driverId: string) => {
    setLoadingReports(true)
    try {
      const res = await fetch(`/api/driver-reports?driverId=${driverId}`)
      if (res.ok) {
        const data = await res.json()
        setReports(Array.isArray(data) ? data : [])
      }
    } catch {
      setReports([])
    } finally {
      setLoadingReports(false)
    }
  }

  const openDriverDetail = async (driver: Driver) => {
    setSelectedDriver(driver)
    fetchReports(driver.id)
    // Fetch all vehicles for the dropdown
    try {
      const res = await fetch("/api/vehicles")
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.vehicles ?? []
        setAllVehicles(list.map((v: any) => ({ id: v.id, registrationNumber: v.registrationNumber, model: v.model })))
      }
    } catch {
      setAllVehicles([])
    }
  }

  const handleSaveReport = async () => {
    if (!selectedDriver || !reportForm.vehicleId || !reportForm.symptoms.trim()) return
    setReportSaving(true)
    try {
      if (editingReportId) {
        const res = await fetch(`/api/driver-reports/${editingReportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: reportForm.vehicleId,
            symptoms: reportForm.symptoms.trim(),
            reportDate: reportForm.reportDate || new Date().toISOString(),
          }),
        })
        if (res.ok) {
          fetchReports(selectedDriver.id)
          setShowReportForm(false)
          setEditingReportId(null)
          setReportForm({ vehicleId: "", symptoms: "", reportDate: "" })
        }
      } else {
        const res = await fetch("/api/driver-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId: selectedDriver.id,
            vehicleId: reportForm.vehicleId,
            symptoms: reportForm.symptoms.trim(),
            reportDate: reportForm.reportDate || new Date().toISOString(),
          }),
        })
        if (res.ok) {
          fetchReports(selectedDriver.id)
          setShowReportForm(false)
          setReportForm({ vehicleId: "", symptoms: "", reportDate: "" })
        }
      }
    } catch (err) {
      console.error("Save report error:", err)
    } finally {
      setReportSaving(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("ต้องการลบรายงานนี้?")) return
    try {
      const res = await fetch(`/api/driver-reports/${reportId}`, { method: "DELETE" })
      if (res.ok && selectedDriver) fetchReports(selectedDriver.id)
    } catch (err) {
      console.error("Delete report error:", err)
    }
  }

  const openEditReport = (report: DriverReport) => {
    setEditingReportId(report.id)
    setReportForm({
      vehicleId: report.vehicleId,
      symptoms: report.symptoms,
      reportDate: report.reportDate.split("T")[0],
    })
    setShowReportForm(true)
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
                            onClick={() => openDriverDetail(d)}
                            className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-info/10 hover:text-info transition-colors"
                            title="รายงานอาการเสีย"
                          >
                            <Pencil className="size-3.5" />
                          </button>
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

      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">รายงานอาการเสีย</h3>
                <p className="text-sm text-muted-foreground">{selectedDriver.rank} {selectedDriver.firstName} {selectedDriver.lastName}</p>
              </div>
              <button onClick={() => { setSelectedDriver(null); setShowReportForm(false); setEditingReportId(null); setReports([]) }} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{reports.length} รายงาน</p>
              <button
                onClick={() => { setShowReportForm(true); setEditingReportId(null); setReportForm({ vehicleId: "", symptoms: "", reportDate: new Date().toISOString().split("T")[0] }) }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="size-3" />
                รายงานอาการเสีย
              </button>
            </div>

            {showReportForm && (
              <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-medium">{editingReportId ? "แก้ไขรายงาน" : "รายงานอาการเสียใหม่"}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">เลือกรถ *</label>
                    <select
                      value={reportForm.vehicleId}
                      onChange={(e) => setReportForm({ ...reportForm, vehicleId: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                    >
                      <option value="">-- เลือกรถ --</option>
                      {allVehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.registrationNumber} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">วันที่แจ้ง</label>
                    <input
                      type="date"
                      value={reportForm.reportDate}
                      onChange={(e) => setReportForm({ ...reportForm, reportDate: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">อาการเสีย *</label>
                  <textarea
                    value={reportForm.symptoms}
                    onChange={(e) => setReportForm({ ...reportForm, symptoms: e.target.value })}
                    placeholder="เขียนอาการเสียของรถได้อย่างอิสระ..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowReportForm(false); setEditingReportId(null); setReportForm({ vehicleId: "", symptoms: "", reportDate: "" }) }} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">ยกเลิก</button>
                  <button
                    onClick={handleSaveReport}
                    disabled={reportSaving || !reportForm.vehicleId || !reportForm.symptoms.trim()}
                    className={cn("rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors", (reportSaving || !reportForm.vehicleId || !reportForm.symptoms.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90")}
                  >
                    {reportSaving ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </div>
            )}

            {loadingReports ? (
              <p className="text-sm text-muted-foreground text-center py-8">กำลังโหลด...</p>
            ) : reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีรายงานอาการเสีย</p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.registrationNumber}</span>
                        <span className="text-xs text-muted-foreground">{r.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(r.reportDate)}</span>
                        <button onClick={() => openEditReport(r)} className="text-muted-foreground hover:text-info transition-colors" title="แก้ไข">
                          <Pencil className="size-3" />
                        </button>
                        <button onClick={() => handleDeleteReport(r.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="ลบ">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{r.symptoms}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
