"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { MapPin, Truck, Clock, RefreshCw, Route, Zap, Fuel, Plus, Pencil, Trash2, X, Save, Calculator, Navigation, ChevronRight, CheckCircle2, CircleDot, MapPinned } from "lucide-react"
import { cn } from "@/lib/utils"

interface GPSPoint { id: string; driverId: string; vehicleId: string; latitude: number; longitude: number; speed: number; heading: number; accuracy: number; recordedAt: string; first_name: string; last_name: string; registrationNumber: string }
interface DriverLocation { driverId: string; firstName: string; lastName: string; vehicleId: string; registrationNumber: string; latitude: number; longitude: number; recordedAt: string; points: GPSPoint[]; distance: number; maxSpeed: number; avgSpeed: number }
interface Trip { id: string; driverId: string; vehicleId: string; origin_tambon: string; origin_amphoe: string; origin_province: string; dest_tambon: string; dest_amphoe: string; dest_province: string; purpose: string; status: string; started_at: string; ended_at: string | null; first_name: string; last_name: string; rank: string; registrationNumber: string; brand: string; model: string }

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
    const allPoints: [number, number][] = []; const colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#8b5cf6", "#0891b2", "#e11d48", "#ca8a04", "#059669", "#7c3aed", "#db2777", "#0d9488", "#c2410c", "#4338ca", "#15803d", "#b91c1c"]
    drivers.forEach((driver, idx) => {
      if (driver.points.length === 0) return; const color = colors[idx % colors.length]
      const latlngs: [number, number][] = driver.points.map((p) => [p.latitude, p.longitude]); allPoints.push(...latlngs)
      if (latlngs.length > 1) { const pl = L.polyline(latlngs, { color, weight: 2, opacity: 0.6, dashArray: "6,8" }).addTo(map); linesRef.current.push(pl) }
      const latest = driver.points[driver.points.length - 1]; const age = Date.now() - new Date(latest.recordedAt).getTime(); const isStale = age > 30 * 60 * 1000
      const icon = L.divIcon({ className: "", html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;opacity:${isStale ? 0.4 : 1};"><span style="color:white;font-size:10px;font-weight:bold;">${driver.registrationNumber.slice(-2)}</span></div>`, iconSize: [32, 32], iconAnchor: [16, 16] })
      const marker = L.marker([latest.latitude, latest.longitude], { icon }).addTo(map)
      marker.bindPopup(`<div style="min-width:150px;font-family:sans-serif"><b style="font-size:13px">${driver.registrationNumber}</b><br/><span style="color:#666;font-size:11px">${driver.firstName} ${driver.lastName}</span><div style="margin-top:4px;font-size:10px;color:#888">📏 ${(driver.distance / 1000).toFixed(2)} km<br/>🏎 ${driver.maxSpeed.toFixed(0)} km/h<br/>🕐 ${new Date(latest.recordedAt).toLocaleString("th-TH")}</div></div>`)
      markersRef.current.push(marker)
    })
    if (allPoints.length > 1) { map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] }) }
  }, [drivers])
  return <div ref={mapRef} className="h-full w-full" />
}

function TripsTab({ session }: { session: any }) {
  const isAdmin = session?.user?.role === "admin"
  const isDriver = session?.user?.role === "driver"
  const currentUserId = (session?.user as any)?.id
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [gpsLocations, setGpsLocations] = useState<Map<string, any>>(new Map())
  const [pinning, setPinning] = useState<"origin" | "dest" | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [tripMapRef, setTripMapRef] = useState<HTMLDivElement | null>(null)
  const [tripMapInstance, setTripMapInstance] = useState<any>(null)
  const [form, setForm] = useState({
    driverId: "", vehicleId: "",
    originTambon: "", originAmphoe: "", originProvince: "",
    destTambon: "", destAmphoe: "", destProvince: "",
    originLat: 0, originLng: 0,
    destLat: 0, destLng: 0,
    purpose: ""
  })

  const reverseGeocode = async (lat: number, lng: number): Promise<{ tambon: string; amphoe: string; province: string }> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th&zoom=18`)
      const data = await res.json()
      const addr = data.address || {}
      return { tambon: addr.suburb || addr.village || addr.neighbourhood || addr.quarter || "", amphoe: addr.city_district || addr.district || addr.county || "", province: addr.state || addr.region || "" }
    } catch { return { tambon: "", amphoe: "", province: "" } }
  }

  const pinLocation = async (type: "origin" | "dest") => {
    if (!navigator.geolocation) { setPinError("เบราว์เซอร์ไม่รองรับ GPS"); return }
    setPinning(type); setPinError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (accuracy > 50) { setPinError(`ความแม่นยำ ${Math.round(accuracy)}m (ต้อง <50m) กรุณาลองใหม่`); setPinning(null); return }
        const geo = await reverseGeocode(lat, lng)
        setForm(f => ({ ...f, [`${type}Lat`]: lat, [`${type}Lng`]: lng, [`${type}Tambon`]: geo.tambon, [`${type}Amphoe`]: geo.amphoe, [`${type}Province`]: geo.province }))
        setPinning(null)
      },
      (err) => { setPinError(err.code === 1 ? "กรุณาเปิดสิทธิ์ location" : "ไม่สามารถระบุตำแหน่งได้"); setPinning(null) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    if (!tripMapInstance) return
    let L: any; try { L = require("leaflet") } catch { return }
    tripMapInstance.eachLayer((layer: any) => { if (layer instanceof L.Marker || layer instanceof L.Circle) tripMapInstance.removeLayer(layer) })
    const allPts: [number, number][] = []
    if (form.originLat && form.originLng) {
      const icon = L.divIcon({ className: "", html: '<div style="background:#16a34a;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:11px;font-weight:bold;">S</span></div>', iconSize: [28, 28], iconAnchor: [14, 14] })
      L.marker([form.originLat, form.originLng], { icon }).addTo(tripMapInstance).bindPopup("<b>ต้นทาง</b><br/>" + form.originTambon + " " + form.originAmphoe + " " + form.originProvince)
      L.circle([form.originLat, form.originLng], { radius: 5, color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.3, weight: 2 }).addTo(tripMapInstance)
      allPts.push([form.originLat, form.originLng])
    }
    if (form.destLat && form.destLng) {
      const icon = L.divIcon({ className: "", html: '<div style="background:#dc2626;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:11px;font-weight:bold;">E</span></div>', iconSize: [28, 28], iconAnchor: [14, 14] })
      L.marker([form.destLat, form.destLng], { icon }).addTo(tripMapInstance).bindPopup("<b>ปลายทาง</b><br/>" + form.destTambon + " " + form.destAmphoe + " " + form.destProvince)
      L.circle([form.destLat, form.destLng], { radius: 5, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.3, weight: 2 }).addTo(tripMapInstance)
      allPts.push([form.destLat, form.destLng])
    }
    if (allPts.length > 1) {
      L.polyline(allPts, { color: "#2563eb", weight: 3, dashArray: "8,8", opacity: 0.7 }).addTo(tripMapInstance)
      tripMapInstance.fitBounds(L.latLngBounds(allPts), { padding: [60, 60] })
    } else if (allPts.length === 1) {
      tripMapInstance.setView(allPts[0], 15)
    }
  }, [tripMapInstance, form.originLat, form.destLat])

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const url = isDriver && currentUserId ? `/api/vehicle-trips?driverId=${currentUserId}` : "/api/vehicle-trips"
      const res = await fetch(url); if (!res.ok) return; const data = await res.json()
      setTrips(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  const fetchGpsForTrips = async (activeTrips: Trip[]) => {
    try {
      const res = await fetch("/api/gps-tracking?latest=true"); if (!res.ok) return; const data = await res.json()
      if (!Array.isArray(data)) return
      const map = new Map<string, any>()
      data.forEach((p: any) => map.set(p.vehicleId, p))
      setGpsLocations(map)
    } catch {}
  }

  useEffect(() => {
    fetchTrips()
    Promise.all([
      fetch("/api/drivers").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/vehicles").then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([d, v]) => {
      setDrivers(Array.isArray(d) ? d : [])
      setVehicles(Array.isArray(v) ? v : [])
    })
  }, [])

  useEffect(() => { if (trips.length > 0) fetchGpsForTrips(trips) }, [trips])

  const openForm = () => {
    if (isDriver && currentUserId) {
      setForm({ driverId: currentUserId, vehicleId: "", originTambon: "", originAmphoe: "", originProvince: "", destTambon: "", destAmphoe: "", destProvince: "", originLat: 0, originLng: 0, destLat: 0, destLng: 0, purpose: "" })
    } else {
      setForm({ driverId: drivers[0]?.id || "", vehicleId: "", originTambon: "", originAmphoe: "", originProvince: "", destTambon: "", destAmphoe: "", destProvince: "", originLat: 0, originLng: 0, destLat: 0, destLng: 0, purpose: "" })
    }
    setPinError(null); setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.driverId || !form.vehicleId) return
    setSaving(true)
    try {
      await fetch("/api/vehicle-trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      setShowForm(false); fetchTrips()
    } finally { setSaving(false) }
  }

  const handleComplete = async (id: string) => {
    if (!confirm("ต้องการจบภารกิจนี้?")) return
    await fetch("/api/vehicle-trips", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "completed" }) })
    fetchTrips()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบรายการนี้?")) return
    await fetch(`/api/vehicle-trips?id=${id}`, { method: "DELETE" })
    fetchTrips()
  }

  const activeTrips = useMemo(() => trips.filter(t => t.status === "active"), [trips])
  const completedTrips = useMemo(() => trips.filter(t => t.status === "completed"), [trips])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">รถกำลังใช้งาน</h3>
          <p className="text-xs text-muted-foreground">พลขับบันทึกเส้นทางการใช้รถ - ลิงค์กับ GPS Tracking</p>
        </div>
        <button onClick={openForm} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="size-3" /> บันทึกการเดินทาง
        </button>
      </div>

      {activeTrips.length > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CircleDot className="size-4 text-success animate-pulse" />
            <h4 className="text-sm font-semibold text-success">กำลังเดินทาง ({activeTrips.length})</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTrips.map((trip) => {
              const gps = gpsLocations.get(trip.vehicleId)
              const elapsed = Math.floor((Date.now() - new Date(trip.started_at).getTime()) / 60000)
              return (
                <div key={trip.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-info" />
                      <span className="text-sm font-bold text-card-foreground">{trip.registrationNumber}</span>
                      <span className="text-xs text-muted-foreground">{trip.brand} {trip.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {gps && <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">GPS ทำงาน</span>}
                      {isAdmin && <button onClick={() => handleComplete(trip.id)} className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-[10px] font-medium text-success hover:bg-success/20 transition-colors"><CheckCircle2 className="size-3" />จบภารกิจ</button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5">ต้นทาง</p>
                      <p className="font-medium text-card-foreground">{trip.origin_tambon || "-"}</p>
                      <p className="text-muted-foreground">{trip.origin_amphoe} {trip.origin_province}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5">ปลายทาง</p>
                      <p className="font-medium text-card-foreground">{trip.dest_tambon || "-"}</p>
                      <p className="text-muted-foreground">{trip.dest_amphoe} {trip.dest_province}</p>
                    </div>
                  </div>
                  {trip.purpose && <p className="text-xs text-muted-foreground">📋 {trip.purpose}</p>}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{trip.rank} {trip.first_name} {trip.last_name}</span>
                    <span>⏱ {elapsed} นาที • {new Date(trip.started_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-card-foreground">ประวัติการเดินทาง ({completedTrips.length})</h3>
          </div>
          {completedTrips.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">ยังไม่มีประวัติ</div>
          ) : (
            <div className="divide-y divide-border">
              {completedTrips.map((trip) => (
                <div key={trip.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground"><Truck className="size-4" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-card-foreground">{trip.registrationNumber}</span>
                          <span className="text-xs text-muted-foreground">{trip.brand} {trip.model}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trip.rank} {trip.first_name} {trip.last_name}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{trip.origin_amphoe} → {trip.dest_amphoe}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(trip.started_at).toLocaleDateString("th-TH")}</p>
                      </div>
                      {isAdmin && <button onClick={() => handleDelete(trip.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="size-3" /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-xl mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">บันทึกการเดินทาง</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {!isDriver && (
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">พลขับ *</label>
                  <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                    <option value="">-- เลือกพลขับ --</option>
                    {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.rank} {d.firstName} {d.lastName}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">ทะเบียนรถ *</label>
                <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                  <option value="">-- เลือกรถ --</option>
                  {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationNumber} - {v.brand} {v.model}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground"><MapPinned className="size-4 text-success" /> ต้นทาง</div>
                <button onClick={() => pinLocation("origin")} disabled={pinning !== null} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", pinning === "origin" ? "bg-success/20 text-success" : "bg-success/10 text-success hover:bg-success/20")}>
                  {pinning === "origin" ? <><span className="size-2 rounded-full bg-success animate-pulse" /> กำลังปักหมุด...</> : <><MapPin className="size-3" /> ปักหมุด GPS</>}
                </button>
              </div>
              {form.originLat > 0 && <p className="text-[10px] text-success">📍 {form.originLat.toFixed(6)}, {form.originLng.toFixed(6)}</p>}
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-[10px] text-muted-foreground mb-1">ตำบล/แขวง</label><input value={form.originTambon} onChange={(e) => setForm({ ...form, originTambon: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="ตำบล" /></div>
                <div><label className="block text-[10px] text-muted-foreground mb-1">อำเภอ/เขต</label><input value={form.originAmphoe} onChange={(e) => setForm({ ...form, originAmphoe: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="อำเภอ" /></div>
                <div><label className="block text-[10px] text-muted-foreground mb-1">จังหวัด</label><input value={form.originProvince} onChange={(e) => setForm({ ...form, originProvince: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="จังหวัด" /></div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground"><MapPin className="size-4 text-destructive" /> ปลายทาง</div>
                <button onClick={() => pinLocation("dest")} disabled={pinning !== null} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", pinning === "dest" ? "bg-destructive/20 text-destructive" : "bg-destructive/10 text-destructive hover:bg-destructive/20")}>
                  {pinning === "dest" ? <><span className="size-2 rounded-full bg-destructive animate-pulse" /> กำลังปักหมุด...</> : <><MapPin className="size-3" /> ปักหมุด GPS</>}
                </button>
              </div>
              {form.destLat > 0 && <p className="text-[10px] text-destructive">📍 {form.destLat.toFixed(6)}, {form.destLng.toFixed(6)}</p>}
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-[10px] text-muted-foreground mb-1">ตำบล/แขวง</label><input value={form.destTambon} onChange={(e) => setForm({ ...form, destTambon: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="ตำบล" /></div>
                <div><label className="block text-[10px] text-muted-foreground mb-1">อำเภอ/เขต</label><input value={form.destAmphoe} onChange={(e) => setForm({ ...form, destAmphoe: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="อำเภอ" /></div>
                <div><label className="block text-[10px] text-muted-foreground mb-1">จังหวัด</label><input value={form.destProvince} onChange={(e) => setForm({ ...form, destProvince: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="จังหวัด" /></div>
              </div>
            </div>

            {(form.originLat > 0 || form.destLat > 0) && <div ref={(el) => { setTripMapRef(el); if (el && !tripMapInstance) { const initMap = async () => { const L = (await import("leaflet")).default; await import("leaflet/dist/leaflet.css"); const map = L.map(el, { center: [form.originLat || form.destLat, form.originLng || form.destLng], zoom: 14, zoomControl: false }); L.control.zoom({ position: "bottomright" }).addTo(map); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' }).addTo(map); setTripMapInstance(map) }; initMap() } }} className="h-[250px] rounded-xl overflow-hidden border border-border" />}

            {pinError && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">⚠ {pinError}</div>}

            <div>
              <label className="block text-xs text-muted-foreground mb-1">วัตถุประสงค์</label>
              <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="เช่น ขนส่งเสบียง, ลาดตระเวน..." />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-input text-sm hover:bg-muted transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving || !form.driverId || !form.vehicleId} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FuelManagement({ session }: { session: any }) {
  const isAdmin = session?.user?.role === "admin"
  const [records, setRecords] = useState<any[]>([])
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

  const openForm = (record?: any) => {
    if (record) { setEditingId(record.id); setForm({ vehicleId: record.vehicleId, fuelRate: record.fuelRate, fuelType: record.fuelType, liters: record.liters, costPerLiter: record.costPerLiter, notes: record.notes, recordedAt: record.recordedAt.split("T")[0] }) }
    else { setEditingId(null); setForm({ vehicleId: vehicles[0]?.id || "", fuelRate: 8, fuelType: "Diesel", liters: 0, costPerLiter: 30, notes: "", recordedAt: new Date().toISOString().split("T")[0] }) }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.vehicleId || !form.fuelRate) return; setSaving(true)
    try {
      if (editingId) await fetch(`/api/fuel-consumption?id=${editingId}`, { method: "DELETE" })
      await fetch("/api/fuel-consumption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fuelRate: Number(form.fuelRate), liters: Number(form.liters), costPerLiter: Number(form.costPerLiter) }) })
      setShowForm(false); setEditingId(null); fetchData()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => { if (!confirm("ต้องการลบ?")) return; await fetch(`/api/fuel-consumption?id=${id}`, { method: "DELETE" }); fetchData() }
  const latestByVehicle = useMemo(() => { const map = new Map(); for (const r of records) { if (!map.has(r.vehicleId)) map.set(r.vehicleId, r) }; return map }, [records])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold text-card-foreground">อัตราการสิ้นเปลืองน้ำมัน</h3><p className="text-xs text-muted-foreground">กำหนดอัตราสิ้นเปลือง (กม./ลิตร) เพื่อคำนวณปริมาณน้ำมัน</p></div>
        {isAdmin && <button onClick={() => openForm()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"><Plus className="size-3" /> เพิ่ม</button>}
      </div>
      {loading ? <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">ทะเบียน</th><th className="px-3 py-3 font-medium">รุ่น</th><th className="px-3 py-3 font-medium text-center">กม./ลิตร</th><th className="px-3 py-3 font-medium text-center">ประเภท</th><th className="px-3 py-3 font-medium text-center">ลิตร</th><th className="px-3 py-3 font-medium text-right">ค่า/ลิตร</th><th className="px-3 py-3 font-medium text-right">รวม</th><th className="px-3 py-3 font-medium">วันที่</th>{isAdmin && <th className="px-3 py-3 font-medium text-center">จัดการ</th>}
            </tr></thead>
            <tbody>
              {records.length === 0 ? <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีรายการ</td></tr> : records.map((r) => {
                const isLatest = latestByVehicle.get(r.vehicleId)?.id === r.id
                return (
                  <tr key={r.id} className={cn("border-b border-border last:border-b-0", isLatest && "bg-success/5")}>
                    <td className="px-4 py-3 font-medium text-card-foreground">{r.registrationNumber}{isLatest && <span className="ml-1.5 text-[10px] text-success">ล่าสุด</span>}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">{r.brand} {r.model}</td>
                    <td className="px-3 py-3 text-center"><span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info"><Fuel className="size-3" /> {r.fuelRate}</span></td>
                    <td className="px-3 py-3 text-center text-xs">{r.fuelType === "Diesel" ? "ดีเซล" : "เบนซิน"}</td>
                    <td className="px-3 py-3 text-center text-xs">{r.liters > 0 ? `${r.liters} ล.` : "-"}</td>
                    <td className="px-3 py-3 text-right text-xs">{r.costPerLiter > 0 ? `฿${r.costPerLiter}` : "-"}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{r.totalCost > 0 ? `฿${r.totalCost.toLocaleString()}` : "-"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(r.recordedAt).toLocaleDateString("th-TH")}</td>
                    {isAdmin && <td className="px-3 py-3"><div className="flex items-center justify-center gap-1"><button onClick={() => openForm(r)} className="size-6 rounded-lg text-muted-foreground hover:bg-info/10 hover:text-info flex items-center justify-center"><Pencil className="size-3" /></button><button onClick={() => handleDelete(r.id)} className="size-6 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"><Trash2 className="size-3" /></button></div></td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-card-foreground">{editingId ? "แก้ไข" : "เพิ่ม"} อัตราสิ้นเปลือง</h3><button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">รถ *</label><select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"><option value="">-- เลือกรถ --</option>{vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registrationNumber} - {v.brand} {v.model}</option>)}</select></div>
              <div><label className="block text-xs text-muted-foreground mb-1">กม./ลิตร *</label><input type="number" step="0.1" value={form.fuelRate} onChange={(e) => setForm({ ...form, fuelRate: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1">ประเภท</label><select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"><option value="Diesel">ดีเซล</option><option value="Gasoline">เบนซิน</option></select></div>
              <div><label className="block text-xs text-muted-foreground mb-1">ลิตรที่เติม</label><input type="number" step="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1">ค่า/ลิตร (฿)</label><input type="number" step="0.01" value={form.costPerLiter} onChange={(e) => setForm({ ...form, costPerLiter: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" /></div>
              <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">วันที่</label><input type="date" value={form.recordedAt} onChange={(e) => setForm({ ...form, recordedAt: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" /></div>
              <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">หมายเหตุ</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" /></div>
            </div>
            {form.liters > 0 && form.costPerLiter > 0 && <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2"><Calculator className="size-4 text-info" /><span className="text-xs text-muted-foreground">รวม: <b>฿{(form.liters * form.costPerLiter).toLocaleString()}</b></span>{form.fuelRate > 0 && <span className="text-xs text-muted-foreground">• วิ่งได้ ~<b>{(form.fuelRate * form.liters).toFixed(0)}</b> กม.</span>}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-2 rounded-lg border border-input text-sm hover:bg-muted transition-colors">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving || !form.vehicleId || !form.fuelRate} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GPSTrackingPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<"map" | "trips" | "fuel">("map")
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
        <div><h1 className="text-xl font-bold text-card-foreground">GPS Tracking</h1><p className="text-sm text-muted-foreground">ติดตามตำแหน่งรถแบบเรียลไทม์</p></div>
        {tab === "map" && <button onClick={() => setAutoRefresh(!autoRefresh)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors", autoRefresh ? "border-success/30 bg-success/10 text-success" : "border-border text-muted-foreground")}><RefreshCw className={cn("size-3", autoRefresh && "animate-spin")} /> {autoRefresh ? "Auto (30s)" : "Off"}</button>}
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button onClick={() => setTab("map")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors", tab === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><MapPin className="size-4" /> แผนที่</button>
        <button onClick={() => setTab("trips")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors", tab === "trips" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Navigation className="size-4" /> รถกำลังใช้งาน</button>
        <button onClick={() => setTab("fuel")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors", tab === "fuel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Fuel className="size-4" /> น้ำมัน</button>
      </div>

      {tab === "map" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><Truck className="size-4 text-info" /><span className="text-xs text-muted-foreground">รถวิ่ง</span></div><p className="text-2xl font-bold text-card-foreground">{locations.length}</p></div>
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><Route className="size-4 text-success" /><span className="text-xs text-muted-foreground">ระยะทาง</span></div><p className="text-2xl font-bold text-success">{(totalDistance / 1000).toFixed(1)} <span className="text-sm font-normal">km</span></p></div>
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><MapPin className="size-4 text-primary" /><span className="text-xs text-muted-foreground">จุดพิกัด</span></div><p className="text-2xl font-bold text-card-foreground">{totalPoints}</p></div>
            <div className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 mb-1"><Zap className="size-4 text-warning" /><span className="text-xs text-muted-foreground">km/h</span></div><p className="text-2xl font-bold text-card-foreground">{locations.length > 0 ? Math.max(...locations.map(l => l.maxSpeed)).toFixed(0) : 0}</p></div>
          </div>
          {loading ? <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div> : locations.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center"><MapPin className="mx-auto mb-3 size-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล GPS</p><p className="text-xs text-muted-foreground mt-1">เปิดเว็บ <b>/gps</b> บนมือถือเพื่อเริ่มติดตาม</p></div>
          ) : (
            <div className="flex gap-3" style={{ height: "65vh" }}>
              <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm min-w-0"><MapComponent drivers={locations} /></div>
              <div className="w-[300px] shrink-0 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
                <div className="border-b border-border px-3 py-2.5 shrink-0"><h3 className="text-xs font-semibold text-card-foreground">รถที่กำลังติดตาม ({locations.length})</h3></div>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {locations.map((loc, idx) => { const age = Date.now() - new Date(loc.recordedAt).getTime(); const isStale = age > 30 * 60 * 1000; const colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#8b5cf6", "#0891b2", "#e11d48", "#ca8a04", "#059669", "#7c3aed", "#db2777", "#0d9488", "#c2410c", "#4338ca", "#15803d", "#b91c1c"]; const c = colors[idx % colors.length]
                    return (
                      <div key={loc.driverId} className="px-3 py-2.5 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="shrink-0 size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c }}>{loc.registrationNumber.slice(-2)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-card-foreground truncate">{loc.registrationNumber}</p>
                              <span className={cn("shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium", isStale ? "bg-muted text-muted-foreground" : "bg-success/10 text-success")}>{isStale ? "OFF" : "ON"}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{loc.firstName} {loc.lastName}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-card-foreground">{(loc.distance / 1000).toFixed(1)} km</p>
                            <p className="text-[9px] text-muted-foreground">⏱ {new Date(loc.recordedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-border px-3 py-2 shrink-0 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div><p className="text-[10px] text-muted-foreground">รถออนไลน์</p><p className="text-sm font-bold text-success">{locations.filter(l => Date.now() - new Date(l.recordedAt).getTime() < 30 * 60 * 1000).length}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">ออฟไลน์</p><p className="text-sm font-bold text-muted-foreground">{locations.filter(l => Date.now() - new Date(l.recordedAt).getTime() >= 30 * 60 * 1000).length}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "trips" && <TripsTab session={session} />}
      {tab === "fuel" && <FuelManagement session={session} />}
    </div>
  )
}
