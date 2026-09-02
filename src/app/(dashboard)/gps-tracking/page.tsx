"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { MapPin, Truck, Clock, RefreshCw, Route, Zap, Fuel, Plus, Pencil, Trash2, X, Save, AlertTriangle, TrendingDown, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"

interface GPSPoint { id: string; driverId: string; vehicleId: string; latitude: number; longitude: number; speed: number; heading: number; accuracy: number; recordedAt: string; first_name: string; last_name: string; registrationNumber: string }
interface DriverLocation { driverId: string; firstName: string; lastName: string; vehicleId: string; registrationNumber: string; latitude: number; longitude: number; recordedAt: string; points: GPSPoint[]; distance: number; maxSpeed: number; avgSpeed: number }
interface FuelRecord { id: string; vehicleId: string; fuelRate: number; fuelType: string; liters: number; costPerLiter: number; totalCost: number; notes: string; recordedAt: string; registrationNumber: string; brand: string; model: string }

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLng = ((lng2 - lng1) * Math.PI) / 180
  return R * 2 * Math.atan2(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2), Math.sqrt(1 - (Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2)))
}

function MapComponent({ drivers }: { drivers: DriverLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null); const mapInstanceRef = useRef<any>(null); const markersRef = useRef<any[]>([]); const linesRef = useRef<any[]>([])
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const load = async () => { const L = (await import("leaflet")).default; await import("leaflet/dist/leaflet.css"); const map = L.map(mapRef.current!, { center: [7.8804, 100.3148], zoom: 13, zoomControl: false }); L.control.zoom({ position: "bottomright" }).addTo(map); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' }).addTo(map); mapInstanceRef.current = map }
    load(); return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
  }, [])
  useEffect(() => {
    const map = mapInstanceRef.current; if (!map) return; let L: any; try { L = require("leaflet") } catch { return }
    markersRef.current.forEach((m: any) => m.remove()); linesRef.current.forEach((l: any) => l.remove()); markersRef.current = []; linesRef.current = []
    const allPoints: [number, number][] = []; const colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#8b5cf6", "#0891b2", "#e11d48", "#ca8a04"]
    drivers.forEach((driver, idx) => {
      if (driver.points.length === 0) return; const color = colors[idx % colors.length]
      const latlngs: [number, number][] = driver.points.map((p) => [p.latitude, p.longitude]); allPoints.push(...latlngs)
      if (latlngs.length > 1) { const pl = L.polyline(latlngs, { color, weight: 3, opacity: 0.7, dashArray: "8,8" }).addTo(map); linesRef.current.push(pl) }
      const latest = driver.points[driver.points.length - 1]; const icon = L.divIcon({ className: "", html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;font-weight:bold;">${driver.registrationNumber.slice(-2)}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 14] })
      const marker = L.marker([latest.latitude, latest.longitude], { icon }).addTo(map)
      marker.bindPopup(`<b>${driver.registrationNumber}</b><br/>${driver.firstName} ${driver.lastName}<br/><small>${(driver.distance / 1000).toFixed(2)} km • ${new Date(latest.recordedAt).toLocaleString("th-TH")}</small>`)
      markersRef.current.push(marker)
    })
    if (allPoints.length > 1) { map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] }) }
  }, [drivers])
  return <div ref={mapRef} className="h-[400px] w-full rounded-xl" />
}

function FuelManagement({ session }: { session: any }) {
  const isAdmin = session?.user?.role === "admin"
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ vehicleId: "", fuelRate: 8, fuelType: "Diesel", liters: 0, costPerLiter: 30, notes: "", recordedAt: new Date().toISOString().split("T")[0] })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fRes, vRes] = await Promise.all([
        fetch("/api/fuel-consumption").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/vehicles").then(r => r.ok ? r.json() : []).catch(() => []),
      ])
      setRecords(Array.isArray(fRes) ? fRes : [])
      setVehicles(Array.isArray(vRes) ? vRes : vRes?.vehicles ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openForm = (record?: FuelRecord) => {
    if (record) {
      setEditingId(record.id)
      setForm({ vehicleId: record.vehicleId, fuelRate: record.fuelRate, fuelType: record.fuelType, liters: record.liters, costPerLiter: record.costPerLiter, notes: record.notes, recordedAt: record.recordedAt.split("T")[0] })
    } else {
      setEditingId(null)
      setForm({ vehicleId: vehicles[0]?.id || "", fuelRate: 8, fuelType: "Diesel", liters: 0, costPerLiter: 30, notes: "", recordedAt: new Date().toISOString().split("T")[0] })
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.vehicleId || !form.fuelRate) return
    setSaving(true)
    try {
      const method = editingId ? "DELETE" : "POST"
      if (editingId) { await fetch(`/api/fuel-consumption?id=${editingId}`, { method: "DELETE" }) }
      await fetch("/api/fuel-consumption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fuelRate: Number(form.fuelRate), liters: Number(form.liters), costPerLiter: Number(form.costPerLiter) }) })
      setShowForm(false); setEditingId(null); fetchData()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบรายการนี้?")) return
    await fetch(`/api/fuel-consumption?id=${id}`, { method: "DELETE" })
    fetchData()
  }

  const latestByVehicle = useMemo(() => {
    const map = new Map<string, FuelRecord>()
    for (const r of records) { if (!map.has(r.vehicleId)) map.set(r.vehicleId, r) }
    return map
  }, [records])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">อัตราการสิ้นเปลืองน้ำมัน</h3>
          <p className="text-xs text-muted-foreground">กำหนดอัตราสิ้นเปลือง (กม./ลิตร) ของรถแต่ละคัน เพื่อคำนวณปริมาณน้ำมันที่ควรใช้</p>
        </div>
        {isAdmin && (
          <button onClick={() => openForm()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="size-3" /> เพิ่มรายการ
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">ทะเบียน</th>
                  <th className="px-3 py-3 font-medium">รุ่น</th>
                  <th className="px-3 py-3 font-medium text-center">อัตราสิ้นเปลือง</th>
                  <th className="px-3 py-3 font-medium text-center">ประเภทเชื้อเพลิง</th>
                  <th className="px-3 py-3 font-medium text-center">จำนวนลิตร</th>
                  <th className="px-3 py-3 font-medium text-right">ค่าใช้จ่าย/ลิตร</th>
                  <th className="px-3 py-3 font-medium text-right">ค่าใช้จ่ายรวม</th>
                  <th className="px-3 py-3 font-medium">วันที่บันทึก</th>
                  <th className="px-3 py-3 font-medium">หมายเหตุ</th>
                  {isAdmin && <th className="px-3 py-3 font-medium text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีรายการ</td></tr>
                ) : records.map((r) => {
                  const isLatest = latestByVehicle.get(r.vehicleId)?.id === r.id
                  return (
                    <tr key={r.id} className={cn("border-b border-border last:border-b-0", isLatest && "bg-success/5")}>
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {r.registrationNumber}
                        {isLatest && <span className="ml-1.5 text-[10px] text-success font-normal">ล่าสุด</span>}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{r.brand} {r.model}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                          <Fuel className="size-3" /> {r.fuelRate} กม./ลิตร
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground">{r.fuelType === "Diesel" ? "ดีเซล" : r.fuelType === "Gasoline" ? "เบนซิน" : "ไฟฟ้า"}</td>
                      <td className="px-3 py-3 text-center text-xs">{r.liters > 0 ? `${r.liters} ล.` : "-"}</td>
                      <td className="px-3 py-3 text-right text-xs">{r.costPerLiter > 0 ? `฿${r.costPerLiter.toFixed(2)}` : "-"}</td>
                      <td className="px-3 py-3 text-right text-xs font-medium">{r.totalCost > 0 ? `฿${r.totalCost.toLocaleString()}` : "-"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(r.recordedAt).toLocaleDateString("th-TH")}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{r.notes || "-"}</td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openForm(r)} className="inline-flex items-center justify-center size-6 rounded-lg text-muted-foreground hover:bg-info/10 hover:text-info transition-colors" title="แก้ไข">
                              <Pencil className="size-3" />
                            </button>
                            <button onClick={() => handleDelete(r.id)} className="inline-flex items-center justify-center size-6 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="ลบ">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">{editingId ? "แก้ไขอัตราสิ้นเปลือง" : "เพิ่มอัตราสิ้นเปลืองน้ำมัน"}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">รถ *</label>
                <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">-- เลือกรถ --</option>
                  {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationNumber} - {v.brand} {v.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">อัตราสิ้นเปลือง (กม./ลิตร) *</label>
                <input type="number" step="0.1" value={form.fuelRate} onChange={(e) => setForm({ ...form, fuelRate: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ประเภทเชื้อเพลิง</label>
                <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="Diesel">ดีเซล</option>
                  <option value="Gasoline">เบนซิน</option>
                  <option value="Electric">ไฟฟ้า</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">จำนวนลิตรที่เติม</label>
                <input type="number" step="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ค่าใช้จ่าย/ลิตร (฿)</label>
                <input type="number" step="0.01" value={form.costPerLiter} onChange={(e) => setForm({ ...form, costPerLiter: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">วันที่บันทึก</label>
                <input type="date" value={form.recordedAt} onChange={(e) => setForm({ ...form, recordedAt: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">หมายเหตุ</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="เช่น เติมเต็มถัง, วิ่งทางไกล..." />
              </div>
            </div>
            {form.liters > 0 && form.costPerLiter > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
                <Calculator className="size-4 text-info" />
                <span className="text-xs text-muted-foreground">ค่าใช้จ่ายรวม: <span className="font-medium text-card-foreground">฿{(form.liters * form.costPerLiter).toLocaleString()}</span></span>
                {form.fuelRate > 0 && <span className="text-xs text-muted-foreground ml-2">• วิ่งได้ ~<span className="font-medium text-card-foreground">{(form.fuelRate * form.liters).toFixed(0)}</span> กม.</span>}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-2 rounded-lg border border-input text-sm hover:bg-muted transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving || !form.vehicleId || !form.fuelRate} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? "กำลังบันทึก..." : editingId ? "บันทึก" : "เพิ่มรายการ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GPSTrackingPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<"map" | "fuel">("map")
  const [locations, setLocations] = useState<DriverLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/gps-tracking"); if (!res.ok) return; const data = await res.json(); if (!Array.isArray(data)) return
      const grouped = new Map<string, DriverLocation>()
      for (const row of data) { const key = row.driverId; if (!grouped.has(key)) grouped.set(key, { driverId: row.driverId, firstName: row.first_name, lastName: row.last_name, vehicleId: row.vehicleId, registrationNumber: row.registrationNumber, latitude: row.latitude, longitude: row.longitude, recordedAt: row.recordedAt, points: [], distance: 0, maxSpeed: 0, avgSpeed: 0 }); grouped.get(key)!.points.push(row) }
      const result: DriverLocation[] = []
      grouped.forEach((loc) => { loc.points.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()); let dist = 0, maxSpd = 0, totalSpd = 0; for (let i = 0; i < loc.points.length; i++) { if (loc.points[i].speed > maxSpd) maxSpd = loc.points[i].speed; totalSpd += loc.points[i].speed || 0; if (i > 0) dist += haversineDistance(loc.points[i - 1].latitude, loc.points[i - 1].longitude, loc.points[i].latitude, loc.points[i].longitude) }; loc.distance = dist; loc.maxSpeed = maxSpd; loc.avgSpeed = loc.points.length > 0 ? totalSpd / loc.points.length : 0; const latest = loc.points[loc.points.length - 1]; loc.latitude = latest.latitude; loc.longitude = latest.longitude; loc.recordedAt = latest.recordedAt; result.push(loc) })
      result.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()); setLocations(result)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData(); if (!autoRefresh) return; const i = setInterval(fetchData, 30000); return () => clearInterval(i) }, [autoRefresh])

  const totalDistance = useMemo(() => locations.reduce((s, l) => s + l.distance, 0), [locations])
  const totalPoints = useMemo(() => locations.reduce((s, l) => s + l.points.length, 0), [locations])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-card-foreground">GPS Tracking</h1>
          <p className="text-sm text-muted-foreground">ติดตามตำแหน่งรถแบบเรียลไทม์</p>
        </div>
        {tab === "map" && (
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors", autoRefresh ? "border-success/30 bg-success/10 text-success" : "border-border text-muted-foreground")}>
            <RefreshCw className={cn("size-3", autoRefresh && "animate-spin")} /> {autoRefresh ? "Auto (30s)" : "Auto Off"}
          </button>
        )}
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button onClick={() => setTab("map")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors", tab === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          <MapPin className="size-4" /> แผนที่
        </button>
        <button onClick={() => setTab("fuel")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors", tab === "fuel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          <Fuel className="size-4" /> อัตราสิ้นเปลืองน้ำมัน
        </button>
      </div>

      {tab === "map" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><Truck className="size-4 text-info" /><span className="text-xs text-muted-foreground">รถวิ่ง</span></div><p className="text-2xl font-bold text-card-foreground">{locations.length}</p></div>
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><Route className="size-4 text-success" /><span className="text-xs text-muted-foreground">ระยะทางรวม</span></div><p className="text-2xl font-bold text-success">{(totalDistance / 1000).toFixed(1)} <span className="text-sm font-normal">km</span></p></div>
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><MapPin className="size-4 text-primary" /><span className="text-xs text-muted-foreground">จุดพิกัด</span></div><p className="text-2xl font-bold text-card-foreground">{totalPoints}</p></div>
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><Zap className="size-4 text-warning" /><span className="text-xs text-muted-foreground">ความเร็วสูงสุด</span></div><p className="text-2xl font-bold text-card-foreground">{locations.length > 0 ? Math.max(...locations.map(l => l.maxSpeed)).toFixed(0) : 0} <span className="text-sm font-normal">km/h</span></p></div>
          </div>
          {loading ? <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div> : locations.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center"><MapPin className="mx-auto mb-3 size-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล GPS</p><p className="text-xs text-muted-foreground mt-1">เปิดเว็บ <b>/gps</b> บนมือถือเพื่อเริ่มติดตาม</p></div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"><MapComponent drivers={locations} /></div>
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3"><h3 className="text-sm font-semibold text-card-foreground">รถที่กำลังติดตาม ({locations.length})</h3></div>
                <div className="divide-y divide-border">
                  {locations.map((loc) => { const age = Date.now() - new Date(loc.recordedAt).getTime(); const isStale = age > 30 * 60 * 1000; return (
                    <div key={loc.driverId} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex items-center justify-center size-10 rounded-full", isStale ? "bg-muted text-muted-foreground" : "bg-info/10 text-info")}><Truck className="size-5" /></div>
                          <div><div className="flex items-center gap-2"><p className="text-sm font-semibold text-card-foreground">{loc.registrationNumber}</p><span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", isStale ? "bg-muted text-muted-foreground" : "bg-success/10 text-success")}>{isStale ? "ออฟไลน์" : "ออนไลน์"}</span></div><p className="text-xs text-muted-foreground">{loc.firstName} {loc.lastName}</p></div>
                        </div>
                        <div className="text-right"><p className="text-sm font-bold text-card-foreground">{(loc.distance / 1000).toFixed(2)} km</p><p className="text-xs text-muted-foreground">⏱ {new Date(loc.recordedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p></div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "fuel" && <FuelManagement session={session} />}
    </div>
  )
}
