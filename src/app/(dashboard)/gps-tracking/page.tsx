"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { MapPin, Navigation, Truck, Clock, RefreshCw, Route, Timer, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface GPSPoint {
  id: string
  driverId: string
  vehicleId: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  accuracy: number
  recordedAt: string
  first_name: string
  last_name: string
  registrationNumber: string
}

interface DriverLocation {
  driverId: string
  firstName: string
  lastName: string
  vehicleId: string
  registrationNumber: string
  latitude: number
  longitude: number
  recordedAt: string
  points: GPSPoint[]
  distance: number
  maxSpeed: number
  avgSpeed: number
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function MapComponent({ drivers, selectedDriver, onSelect }: { drivers: DriverLocation[]; selectedDriver: string | null; onSelect: (id: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const linesRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")
      const map = L.map(mapRef.current!, { center: [7.8804, 100.3148], zoom: 13, zoomControl: false })
      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' }).addTo(map)
      mapInstanceRef.current = map
    }
    loadLeaflet()
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    let L: any
    try { L = require("leaflet") } catch { return }

    markersRef.current.forEach((m: any) => m.remove())
    linesRef.current.forEach((l: any) => l.remove())
    markersRef.current = []
    linesRef.current = []

    const allPoints: [number, number][] = []
    const colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#8b5cf6", "#0891b2", "#e11d48", "#ca8a04"]

    drivers.forEach((driver, idx) => {
      if (driver.points.length === 0) return
      const isSelected = selectedDriver === driver.driverId
      const color = colors[idx % colors.length]
      const latlngs: [number, number][] = driver.points.map((p) => [p.latitude, p.longitude])
      allPoints.push(...latlngs)

      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, {
          color, weight: isSelected ? 5 : 3, opacity: isSelected ? 1 : 0.6, dashArray: isSelected ? undefined : "8,8",
        }).addTo(map)
        linesRef.current.push(polyline)
      }

      const latest = driver.points[driver.points.length - 1]
      const age = Date.now() - new Date(latest.recordedAt).getTime()
      const isStale = age > 30 * 60 * 1000
      const opacity = isStale ? 0.5 : 1

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};width:${isSelected ? 36 : 28}px;height:${isSelected ? 36 : 28}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;opacity:${opacity};transition:all 0.2s;transform:scale(${isSelected ? 1.2 : 1})">
          <span style="color:white;font-size:${isSelected ? 12 : 10}px;font-weight:bold;">${driver.registrationNumber.slice(-2)}</span>
        </div>`,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
      })

      const marker = L.marker([latest.latitude, latest.longitude], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="min-width:160px;font-family:sans-serif">
          <b style="font-size:14px">${driver.registrationNumber}</b><br/>
          <span style="color:#666;font-size:12px">${driver.firstName} ${driver.lastName}</span><br/>
          <div style="margin-top:6px;font-size:11px;color:#888">
            📍 ${(driver.distance / 1000).toFixed(2)} km<br/>
            🏎 ${driver.maxSpeed.toFixed(0)} km/h<br/>
            🕐 ${new Date(latest.recordedAt).toLocaleString("th-TH")}
          </div>
        </div>
      `)
      marker.on("click", () => onSelect(driver.driverId))
      markersRef.current.push(marker)
    })

    if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [drivers, selectedDriver])

  return <div ref={mapRef} className="h-[450px] w-full rounded-xl" />
}

export default function GPSTrackingPage() {
  const [locations, setLocations] = useState<DriverLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/gps-tracking")
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return

      const grouped = new Map<string, DriverLocation>()
      for (const row of data) {
        const key = row.driverId
        if (!grouped.has(key)) {
          grouped.set(key, {
            driverId: row.driverId, firstName: row.first_name, lastName: row.last_name,
            vehicleId: row.vehicleId, registrationNumber: row.registrationNumber,
            latitude: row.latitude, longitude: row.longitude, recordedAt: row.recordedAt,
            points: [], distance: 0, maxSpeed: 0, avgSpeed: 0,
          })
        }
        grouped.get(key)!.points.push(row)
      }

      const result: DriverLocation[] = []
      grouped.forEach((loc) => {
        loc.points.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        let dist = 0, maxSpd = 0, totalSpd = 0
        for (let i = 0; i < loc.points.length; i++) {
          if (loc.points[i].speed > maxSpd) maxSpd = loc.points[i].speed
          totalSpd += loc.points[i].speed || 0
          if (i > 0) dist += haversineDistance(loc.points[i - 1].latitude, loc.points[i - 1].longitude, loc.points[i].latitude, loc.points[i].longitude)
        }
        loc.distance = dist
        loc.maxSpeed = maxSpd
        loc.avgSpeed = loc.points.length > 0 ? totalSpd / loc.points.length : 0
        const latest = loc.points[loc.points.length - 1]
        loc.latitude = latest.latitude
        loc.longitude = latest.longitude
        loc.recordedAt = latest.recordedAt
        result.push(loc)
      })

      result.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      setLocations(result)
    } catch (err) {
      console.error("GPS fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const totalDistance = useMemo(() => locations.reduce((s, l) => s + l.distance, 0), [locations])
  const totalPoints = useMemo(() => locations.reduce((s, l) => s + l.points.length, 0), [locations])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-card-foreground">GPS Tracking</h1>
          <p className="text-sm text-muted-foreground">ติดตามตำแหน่งรถแบบเรียลไทม์</p>
        </div>
        <button onClick={() => setAutoRefresh(!autoRefresh)}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
            autoRefresh ? "border-success/30 bg-success/10 text-success" : "border-border text-muted-foreground")}>
          <RefreshCw className={cn("size-3", autoRefresh && "animate-spin")} />
          {autoRefresh ? "Auto (30s)" : "Auto Off"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="size-4 text-info" />
            <span className="text-xs text-muted-foreground">รถที่กำลังวิ่ง</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{locations.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Route className="size-4 text-success" />
            <span className="text-xs text-muted-foreground">ระยะทางรวม</span>
          </div>
          <p className="text-2xl font-bold text-success">{(totalDistance / 1000).toFixed(1)} <span className="text-sm font-normal">km</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">จุดพิกัดทั้งหมด</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{totalPoints}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="size-4 text-warning" />
            <span className="text-xs text-muted-foreground">ความเร็วสูงสุด</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">
            {locations.length > 0 ? Math.max(...locations.map(l => l.maxSpeed)).toFixed(0) : 0} <span className="text-sm font-normal">km/h</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : locations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MapPin className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล GPS</p>
          <p className="text-xs text-muted-foreground mt-1">พลขับยังไม่ได้เปิดติดตามตำแหน่ง</p>
          <p className="text-xs text-muted-foreground mt-3">เปิดเว็บ <b>/gps</b> บนมือถือเพื่อเริ่มติดตาม</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <MapComponent drivers={locations} selectedDriver={selectedDriver} onSelect={setSelectedDriver} />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-card-foreground">รถที่กำลังติดตาม ({locations.length})</h3>
              <button onClick={() => setSelectedDriver(null)}
                className={cn("text-xs px-2 py-1 rounded-lg transition-colors",
                  selectedDriver ? "bg-muted text-foreground hover:bg-muted/80" : "text-muted-foreground")}>
                แสดงทั้งหมด
              </button>
            </div>
            <div className="divide-y divide-border">
              {locations.filter(l => !selectedDriver || l.driverId === selectedDriver).map((loc) => {
                const age = Date.now() - new Date(loc.recordedAt).getTime()
                const isStale = age > 30 * 60 * 1000
                const minutesAgo = Math.floor(age / 60000)

                return (
                  <div key={loc.driverId}
                    className={cn("px-4 py-3 transition-colors cursor-pointer",
                      selectedDriver === loc.driverId ? "bg-info/5" : "hover:bg-muted/50")}
                    onClick={() => setSelectedDriver(selectedDriver === loc.driverId ? null : loc.driverId)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex items-center justify-center size-10 rounded-full",
                          isStale ? "bg-muted text-muted-foreground" : "bg-info/10 text-info")}>
                          <Truck className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-card-foreground">{loc.registrationNumber}</p>
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              isStale ? "bg-muted text-muted-foreground" : "bg-success/10 text-success")}>
                              {isStale ? `${minutesAgo} นาทีที่แล้ว` : "ออนไลน์"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{loc.firstName} {loc.lastName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-card-foreground">{(loc.distance / 1000).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">km</span></p>
                        <p className="text-xs text-muted-foreground">⏱ {new Date(loc.recordedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg py-1">
                        <p className="text-xs font-medium text-card-foreground">{loc.points.length}</p>
                        <p className="text-[10px] text-muted-foreground">จุดพิกัด</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-1">
                        <p className="text-xs font-medium text-card-foreground">{loc.maxSpeed.toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground">km/h สูงสุด</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-1">
                        <p className="text-xs font-medium text-card-foreground">{loc.avgSpeed.toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground">km/h เฉลี่ย</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-1">
                        <p className="text-xs font-medium text-card-foreground">{loc.latitude.toFixed(5)}</p>
                        <p className="text-[10px] text-muted-foreground">{loc.longitude.toFixed(5)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
