"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Truck, Calendar, Gauge, Fuel, Upload, X, ImagePlus, Star, Trash2, Pencil, Save, UserPlus, UserMinus, ChevronLeft, ChevronRight, User } from "lucide-react"
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

const urgencyLabels: Record<string, { label: string; className: string }> = {
  LOW: { label: "ปกติ", className: "text-muted-foreground bg-muted" },
  MEDIUM: { label: "ปานกลาง", className: "text-status-parts bg-status-parts/10" },
  HIGH: { label: "สูง", className: "text-destructive bg-destructive/10" },
  EMERGENCY: { label: "ด่วนมาก", className: "text-destructive bg-destructive" },
}

const scheduleStatusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอดำเนินการ", className: "text-muted-foreground bg-muted" },
  DUE_SOON: { label: "ใกล้ถึงกำหนด", className: "text-status-due bg-status-due/10" },
  OVERDUE: { label: "เกินกำหนด", className: "text-status-overdue bg-status-overdue/10" },
  COMPLETED: { label: "เสร็จแล้ว", className: "text-success bg-success/10" },
}

interface Photo {
  id: string
  photoUrl: string
  isPrimary: boolean
}

interface DriverInfo {
  id: string
  rank: string
  firstName: string
  lastName: string
  photoUrl: string | null
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [drivers, setDrivers] = useState<DriverInfo[]>([])
  const [allDrivers, setAllDrivers] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [editReg, setEditReg] = useState("")
  const [editModel, setEditModel] = useState("")
  const [editYear, setEditYear] = useState(0)
  const [editMileage, setEditMileage] = useState(0)
  const [editVehicleTypeId, setEditVehicleTypeId] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [vehicleTypes, setVehicleTypes] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [showDriverPicker, setShowDriverPicker] = useState(false)
  const [editingRR, setEditingRR] = useState<string | null>(null)
  const [editRRSymptoms, setEditRRSymptoms] = useState("")
  const [editRRStatus, setEditRRStatus] = useState("")
  const [editingMS, setEditingMS] = useState<string | null>(null)
  const [editMSNextDate, setEditMSNextDate] = useState("")
  const [editMSNextMileage, setEditMSNextMileage] = useState("")
  const [editMSStatus, setEditMSStatus] = useState("")
  const [editMSLastDate, setEditMSLastDate] = useState("")
  const [editMSLastMileage, setEditMSLastMileage] = useState("")

  useEffect(() => {
    fetchVehicle()
    fetch("/api/drivers").then((r) => r.json()).then((d) => setAllDrivers(d)).catch(() => {})
    fetch("/api/vehicle-types").then((r) => r.json()).then((d) => setVehicleTypes(d)).catch(() => {})
  }, [params.id])

  const fetchVehicle = () => {
    fetch(`/api/vehicles/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setVehicle(data)
        setPhotos(data.photos ?? [])
        setDrivers(data.drivers ?? [])
        setEditReg(data.registrationNumber)
        setEditModel(data.model)
        setEditYear(data.year)
        setEditMileage(data.currentMileage)
        setEditVehicleTypeId(data.vehicleTypeId ?? "")
        setEditStatus(data.status)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("vehicleId", params.id as string)
    formData.append("isPrimary", photos.length === 0 ? "true" : "false")

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        const newPhoto = await res.json()
        setPhotos((prev) => [newPhoto, ...prev])
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm("ต้องการลบรูปนี้?")) return
    try {
      const res = await fetch(`/api/upload?id=${photoId}`, { method: "DELETE" })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId))
        if (selectedPhoto === photoId) setSelectedPhoto(null)
      }
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    try {
      await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, vehicleId: params.id }),
      })
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === photoId }))
      )
    } catch (err) {
      console.error("Set primary failed:", err)
    }
  }

  const handleSaveVehicle = async () => {
    setSaving(true)
    try {
      await fetch(`/api/vehicles/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: editReg, model: editModel, year: editYear, currentMileage: editMileage, vehicleTypeId: editVehicleTypeId, status: editStatus }),
      })
      fetchVehicle()
      setEditing(false)
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleAssignDriver = async (driverId: string) => {
    try {
      await fetch("/api/vehicle-drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: params.id, driverId }),
      })
      fetchVehicle()
      setShowDriverPicker(false)
    } catch (err) {
      console.error("Assign error:", err)
    }
  }

  const handleUnassignDriver = async (driverId: string) => {
    try {
      await fetch(`/api/vehicle-drivers?vehicleId=${params.id}&driverId=${driverId}`, { method: "DELETE" })
      fetchVehicle()
    } catch (err) {
      console.error("Unassign error:", err)
    }
  }

  const handleSaveRepairRequest = async (id: string) => {
    try {
      await fetch(`/api/repair-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: editRRSymptoms || undefined,
          status: editRRStatus || undefined,
        }),
      })
      setEditingRR(null)
      fetchVehicle()
    } catch (err) {
      console.error("Update repair request error:", err)
    }
  }

  const handleSaveMaintenanceSchedule = async (id: string) => {
    try {
      await fetch(`/api/maintenance-schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastPerformedDate: editMSLastDate || undefined,
          lastPerformedMileage: editMSLastMileage ? Number(editMSLastMileage) : undefined,
          nextDueDate: editMSNextDate || undefined,
          nextDueMileage: editMSNextMileage ? Number(editMSNextMileage) : undefined,
          status: editMSStatus || undefined,
        }),
      })
      setEditingMS(null)
      fetchVehicle()
    } catch (err) {
      console.error("Update maintenance schedule error:", err)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">กำลังโหลด...</div>
      </div>
    )
  }

  if (!vehicle || vehicle.error) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Truck className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่พบข้อมูลยานพาหนะ</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-info hover:underline">กลับ</button>
        </div>
      </div>
    )
  }

  const status = statusMeta[vehicle.status] ?? { label: vehicle.status, className: "text-muted-foreground bg-muted" }
  const primaryPhoto = photos.find((p) => p.isPrimary) ?? photos[0]
  const availableDrivers = allDrivers.filter((d: any) => !drivers.some((vd) => vd.id === d.id))

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          กลับ
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {primaryPhoto ? (
              <img
                src={primaryPhoto.photoUrl}
                alt={vehicle.registrationNumber}
                className="size-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Truck className="size-6" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{vehicle.registrationNumber}</h2>
              <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
                <Pencil className="size-3" />
                แก้ไข
              </button>
            )}
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>
              {status.label}
            </span>
          </div>
        </div>

        {editing ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">หมายเลขทะเบียน</label>
                <input type="text" value={editReg} onChange={(e) => setEditReg(e.target.value)} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">รุ่น</label>
                <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ปี</label>
                <input type="number" value={editYear} onChange={(e) => setEditYear(Number(e.target.value))} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">เลขไมล์ (กม.)</label>
                <input type="number" value={editMileage} onChange={(e) => setEditMileage(Number(e.target.value))} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ประเภทรถ</label>
                <select value={editVehicleTypeId} onChange={(e) => setEditVehicleTypeId(e.target.value)} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
                  <option value="">-- เลือกประเภท --</option>
                  {vehicleTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">สถานะ</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
                  <option value="AVAILABLE">พร้อมใช้งาน</option>
                  <option value="IN_REPAIR">กำลังซ่อม</option>
                  <option value="WAITING_PARTS">รออะไหล่</option>
                  <option value="OUT_OF_SERVICE">รถงดใช้งาน</option>
                  <option value="IN_USE">กำลังใช้งาน</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">ยกเลิก</button>
              <button onClick={handleSaveVehicle} disabled={saving} className={cn("inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity", saving && "opacity-50 pointer-events-none")}>
                <Save className="size-3.5" />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">ปี</p><p className="font-medium text-card-foreground">{vehicle.year}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">ประเภท</p><p className="font-medium text-card-foreground">{vehicle.vehicleType}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-muted-foreground" />
            <div><p className="text-muted-foreground">เลขไมล์</p><p className="font-medium text-card-foreground">{vehicle.currentMileage?.toLocaleString()} กม.</p></div>
          </div>
            <div className="flex items-center gap-2">
              <Fuel className="size-4 text-muted-foreground" />
              <div><p className="text-muted-foreground">เชื้อเพลิง</p><p className="font-medium text-card-foreground">{vehicle.fuelType}</p></div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">ผู้รับผิดชอบรถ</h3>
            <p className="text-xs text-muted-foreground">{drivers.length} คน</p>
          </div>
          <button onClick={() => setShowDriverPicker(!showDriverPicker)} className="inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info cursor-pointer hover:bg-info/20 transition-colors">
            <UserPlus className="size-3.5" />
            เพิ่มคนขับ
          </button>
        </div>
        <div className="px-5 pb-5">
          {showDriverPicker && availableDrivers.length > 0 && (
            <div className="mb-3 rounded-lg border border-border bg-muted/30 p-2 space-y-1">
              {availableDrivers.map((d: any) => (
                <button key={d.id} onClick={() => handleAssignDriver(d.id)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left hover:bg-muted transition-colors">
                  <span className="text-muted-foreground">{d.rank}</span>
                  <span className="font-medium text-card-foreground">{d.firstName} {d.lastName}</span>
                </button>
              ))}
            </div>
          )}
          {drivers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีผู้รับผิดชอบ</p>
          ) : (
            <div className="space-y-2">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {d.photoUrl ? (
                      <img src={d.photoUrl} alt={d.firstName} className="size-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="size-5" />
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">{d.rank}</span>{" "}
                      <span className="font-medium text-card-foreground">{d.firstName} {d.lastName}</span>
                    </div>
                  </div>
                  <button onClick={() => handleUnassignDriver(d.id)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="เลิกมอบหมาย">
                    <UserMinus className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">รูปภาพยานพาหนะ</h3>
            <p className="text-xs text-muted-foreground">{photos.length} รูป</p>
          </div>
          <label
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info cursor-pointer hover:bg-info/20 transition-colors",
              uploading && "opacity-50 pointer-events-none"
            )}
          >
            <Upload className="size-3.5" />
            {uploading ? "กำลังอัปโหลด..." : "เพิ่มรูป"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
        <div className="px-5 pb-5">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ImagePlus className="size-10 mb-2" />
              <p className="text-xs">ยังไม่มีรูปภาพ</p>
              <p className="text-xs">กด &quot;เพิ่มรูป&quot; เพื่ออัปโหลดรูปแรก</p>
            </div>
          ) : (
            <>
              {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                  <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={photos.find((p) => p.id === selectedPhoto)?.photoUrl}
                      alt="Vehicle photo"
                      className="w-full rounded-xl object-contain max-h-[80vh]"
                    />
                    <button
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="size-4" />
                    </button>
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const idx = photos.findIndex((p) => p.id === selectedPhoto)
                            const prev = idx > 0 ? idx - 1 : photos.length - 1
                            setSelectedPhoto(photos[prev].id)
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="size-5" />
                        </button>
                        <button
                          onClick={() => {
                            const idx = photos.findIndex((p) => p.id === selectedPhoto)
                            const next = idx < photos.length - 1 ? idx + 1 : 0
                            setSelectedPhoto(photos[next].id)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="size-5" />
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {photos.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPhoto(p.id)}
                          className={cn(
                            "size-2 rounded-full transition-colors",
                            p.id === selectedPhoto ? "bg-white" : "bg-white/40 hover:bg-white/60"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer"
                    onClick={() => setSelectedPhoto(photo.id)}
                  >
                    <img
                      src={photo.photoUrl}
                      alt="Vehicle"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                      {!photo.isPrimary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo.id) }}
                          className="size-7 rounded-full bg-white/90 text-foreground flex items-center justify-center hover:bg-white"
                          title="ตั้งเป็นรูปหลัก"
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
                        className="size-7 rounded-full bg-white/90 text-destructive flex items-center justify-center hover:bg-white"
                        title="ลบรูป"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {photo.isPrimary && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="inline-flex items-center rounded-full bg-info px-1.5 py-0.5 text-[9px] font-medium text-white">
                          หลัก
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-card-foreground">ประวัติแจ้งซ่อม</h3>
            <p className="text-xs text-muted-foreground">{(vehicle.repairRequests ?? []).length} รายการ</p>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {(vehicle.repairRequests ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีประวัติ</p>
            ) : (
              (vehicle.repairRequests ?? []).map((rr: any) => {
                const urg = urgencyLabels[rr.urgency] ?? urgencyLabels.MEDIUM
                const isEditing = editingRR === rr.id
                return (
                  <div key={rr.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{rr.requestNumber}</span>
                      <div className="flex items-center gap-1">
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", urg.className)}>
                          {urg.label}
                        </span>
                        {!isEditing && (
                          <button onClick={() => { setEditingRR(rr.id); setEditRRSymptoms(rr.symptoms); setEditRRStatus(rr.status) }} className="p-1 text-muted-foreground hover:text-info">
                            <Pencil className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <textarea value={editRRSymptoms} onChange={(e) => setEditRRSymptoms(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" rows={2} />
                        <select value={editRRStatus} onChange={(e) => setEditRRStatus(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                          <option value="PENDING">รอดำเนินการ</option>
                          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                          <option value="COMPLETED">เสร็จแล้ว</option>
                          <option value="CANCELLED">ยกเลิก</option>
                        </select>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditingRR(null)} className="px-2 py-1 text-xs border border-border rounded-lg hover:bg-muted">ยกเลิก</button>
                          <button onClick={() => handleSaveRepairRequest(rr.id)} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90">บันทึก</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-card-foreground">{rr.symptoms}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{rr.systemCategory}</span>
                          {rr.workOrder && <span>• WO: {rr.workOrder.woNumber}</span>}
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-card-foreground">แผนซ่อมบำรุง</h3>
            <p className="text-xs text-muted-foreground">{(vehicle.maintenanceSchedules ?? []).length} แผน</p>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {(vehicle.maintenanceSchedules ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีแผน</p>
            ) : (
              (vehicle.maintenanceSchedules ?? []).map((ms: any) => {
                const sStatus = scheduleStatusLabels[ms.status] ?? scheduleStatusLabels.PENDING
                const isEditing = editingMS === ms.id
                return (
                  <div key={ms.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-card-foreground">{ms.planName}</span>
                      <div className="flex items-center gap-1">
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", sStatus.className)}>
                          {sStatus.label}
                        </span>
                        {!isEditing && (
                          <button onClick={() => { setEditingMS(ms.id); setEditMSLastDate(ms.lastPerformedDate ? new Date(ms.lastPerformedDate).toISOString().split("T")[0] : ""); setEditMSLastMileage(ms.lastPerformedMileage?.toString() ?? ""); setEditMSNextDate(ms.nextDueDate ? new Date(ms.nextDueDate).toISOString().split("T")[0] : ""); setEditMSNextMileage(ms.nextDueMileage?.toString() ?? ""); setEditMSStatus(ms.status) }} className="p-1 text-muted-foreground hover:text-info">
                            <Pencil className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">วันที่ทำครั้งล่าสุด</label>
                            <input type="date" value={editMSLastDate} onChange={(e) => setEditMSLastDate(e.target.value)} className="w-full px-2 py-1 text-xs border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">เลขไมล์ล่าสุด</label>
                            <input type="number" value={editMSLastMileage} onChange={(e) => setEditMSLastMileage(e.target.value)} className="w-full px-2 py-1 text-xs border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">วันที่รอบถัดไป</label>
                            <input type="date" value={editMSNextDate} onChange={(e) => setEditMSNextDate(e.target.value)} className="w-full px-2 py-1 text-xs border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">เลขไมล์รอบถัดไป</label>
                            <input type="number" value={editMSNextMileage} onChange={(e) => setEditMSNextMileage(e.target.value)} className="w-full px-2 py-1 text-xs border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                          </div>
                        </div>
                        <select value={editMSStatus} onChange={(e) => setEditMSStatus(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                          <option value="PENDING">รอดำเนินการ</option>
                          <option value="DUE_SOON">ใกล้ถึงกำหนด</option>
                          <option value="OVERDUE">เกินกำหนด</option>
                          <option value="COMPLETED">เสร็จแล้ว</option>
                        </select>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditingMS(null)} className="px-2 py-1 text-xs border border-border rounded-lg hover:bg-muted">ยกเลิก</button>
                          <button onClick={() => handleSaveMaintenanceSchedule(ms.id)} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90">บันทึก</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        {ms.lastPerformedDate && <p>ทำครั้งล่าสุด: {new Date(ms.lastPerformedDate).toLocaleDateString("th-TH")}</p>}
                        {ms.nextDueDate ? <p>รอบถัดไป: {new Date(ms.nextDueDate).toLocaleDateString("th-TH")}</p> : <p>รอบถัดไป: ยังไม่กำหนด</p>}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
