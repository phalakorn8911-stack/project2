"use client"

import { useEffect, useState, Suspense, useRef, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Plus, Filter, Truck, X, Pencil, Trash2, MapPin } from "lucide-react"
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

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function GPSModal({ vehicle, points, loading, onClose, mapRef, mapInstanceRef }: {
  vehicle: any; points: any[]; loading: boolean; onClose: () => void;
  mapRef: React.RefObject<HTMLDivElement | null>; mapInstanceRef: React.MutableRefObject<any>
}) {
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || points.length === 0) return
    let cancelled = false
    const init = async () => {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")
      if (cancelled || !mapRef.current) return
      const latlngs: [number, number][] = points.map((p: any) => [p.latitude, p.longitude])
      const center = latlngs[Math.floor(latlngs.length / 2)] || latlngs[0]
      const map = L.map(mapRef.current!, { center, zoom: 14, zoomControl: false })
      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' }).addTo(map)
      L.polyline(latlngs, { color: "#2563eb", weight: 4, opacity: 0.9 }).addTo(map)
      if (latlngs.length > 1) {
        L.polyline([latlngs[0], latlngs[latlngs.length - 1]], { color: "#dc2626", weight: 2, dashArray: "6,6" }).addTo(map)
      }
      const startIcon = L.divIcon({ className: "", html: '<div style="background:#16a34a;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;">S</span></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
      const endIcon = L.divIcon({ className: "", html: '<div style="background:#dc2626;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;">E</span></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
      L.marker(latlngs[0], { icon: startIcon }).addTo(map).bindPopup("จุดเริ่มต้น")
      L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map).bindPopup("จุดล่าสุด")
      latlngs.forEach((ll, i) => {
        if (i % Math.max(1, Math.floor(latlngs.length / 10)) === 0 || i === latlngs.length - 1) {
          L.circleMarker(ll, { radius: 4, color: "#2563eb", fillColor: "white", fillOpacity: 1, weight: 2 }).addTo(map)
        }
      })
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] })
      mapInstanceRef.current = map
    }
    init()
    return () => { cancelled = true; if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
  }, [points])

  const totalDistance = useMemo(() => {
    let d = 0
    for (let i = 1; i < points.length; i++) {
      d += haversineDistance(points[i - 1].latitude, points[i - 1].longitude, points[i].latitude, points[i].longitude)
    }
    return d
  }, [points])

  const maxSpeed = useMemo(() => points.reduce((m, p) => Math.max(m, p.speed || 0), 0), [points])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-card-foreground">GPS - {vehicle.registrationNumber}</h3>
            <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model} • {points.length} จุดพิกัด</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
          {points.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold text-card-foreground">{(totalDistance / 1000).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">ระยะทาง (km)</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold text-card-foreground">{maxSpeed.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">ความเร็วสูงสุด (km/h)</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold text-card-foreground">{points.length}</p>
                <p className="text-[10px] text-muted-foreground">จุดพิกัด</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">กำลังโหลดแผนที่...</div>
          ) : points.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <MapPin className="mb-2 size-8" />
              <p className="text-sm">ยังไม่มีข้อมูล GPS สำหรับรถคันนี้</p>
            </div>
          ) : (
            <div ref={mapRef} className="h-[350px] rounded-xl overflow-hidden" />
          )}
        </div>
      </div>
    </div>
  )
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

  const [gpsModal, setGpsModal] = useState<{ open: boolean; vehicle: any | null }>({ open: false, vehicle: null })
  const [gpsPoints, setGpsPoints] = useState<any[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

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

  const openGpsModal = async (vehicle: any) => {
    setGpsModal({ open: true, vehicle })
    setGpsLoading(true)
    setGpsPoints([])
    try {
      const res = await fetch(`/api/gps-tracking?vehicleId=${vehicle.id}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setGpsPoints(data)
      }
    } catch {} finally {
      setGpsLoading(false)
    }
  }

  const closeGpsModal = () => {
    setGpsModal({ open: false, vehicle: null })
    setGpsPoints([])
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
  }

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
                    <td className="px-4 py-3 font-medium text-card-foreground whitespace-nowrap">{v.registrationNumber}</td>
                    <td className="px-3 py-3 text-card-foreground whitespace-nowrap">{v.brand} {v.model}</td>
                    <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{v.year}</td>
                    <td className="px-3 py-3 whitespace-nowrap"><span className="inline-block text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">{v.type}</span></td>
                    <td className="px-3 py-3 text-muted-foreground">{v.unit}</td>
                    <td className="px-3 py-3 text-muted-foreground">{v.mileage}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", status.className)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openGpsModal(v)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-success/10 hover:text-success transition-colors" title="GPS">
                          <MapPin className="size-3.5" />
                        </button>
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

      {gpsModal.open && gpsModal.vehicle && (
        <GPSModal vehicle={gpsModal.vehicle} points={gpsPoints} loading={gpsLoading} onClose={closeGpsModal} mapRef={mapRef} mapInstanceRef={mapInstanceRef} />
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
