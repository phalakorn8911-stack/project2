"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { MapPin, Navigation, Truck, Clock, Trash2, RefreshCw } from "lucide-react"
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
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function MapComponent({ drivers }: { drivers: DriverLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const linesRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const loadLeaflet = async () => {
      if (typeof window === "undefined") return
      const L = (await import("leaflet")).default

      await import("leaflet/dist/leaflet.css")

      const map = L.map(mapRef.current!, {
        center: [7.8804, 100.3148],
        zoom: 13,
        zoomControl: false,
      })

      L.control.zoom({ position: "bottomright" }).addTo(map)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      mapInstanceRef.current = map
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    let L: any
    try {
      L = require("leaflet")
    } catch {
      return
    }

    markersRef.current.forEach((m: any) => m.remove())
    linesRef.current.forEach((l: any) => l.remove())
    markersRef.current = []
    linesRef.current = []

    const allPoints: [number, number][] = []

    drivers.forEach((driver) => {
      if (driver.points.length === 0) return

      const colors = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#8b5cf6", "#0891b2"]
      const colorIdx = drivers.indexOf(driver) % colors.length
      const color = colors[colorIdx]

      const latlngs: [number, number][] = driver.points.map((p) => [p.latitude, p.longitude])
      allPoints.push(...latlngs)

      if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, { color, weight: 3, opacity: 0.8, dashArray: "5,10" }).addTo(map)
        linesRef.current.push(polyline)
      }

      const latest = driver.points[driver.points.length - 1]
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:11px;font-weight:bold;">${driver.registrationNumber.slice(-2)}</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([latest.latitude, latest.longitude], { icon }).addTo(map)
      marker.bindPopup(`
        <b>${driver.registrationNumber}</b><br/>
        ${driver.firstName} ${driver.lastName}<br/>
        <small>${new Date(latest.recordedAt).toLocaleString("th-TH")}</small>
      `)
      markersRef.current.push(marker)
    })

    if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [drivers])

  return <div ref={mapRef} className="h-[400px] w-full rounded-xl" />
}

export default function GPSTrackingPage() {
  const [locations, setLocations] = useState<DriverLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/gps-tracking?latest=true")
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return

      const resAll = await fetch("/api/gps-tracking")
      if (!resAll.ok) return
      const allData = await resAll.json()
      if (!Array.isArray(allData)) return

      const grouped = new Map<string, DriverLocation>()
      for (const row of allData) {
        const key = row.driverId
        if (!grouped.has(key)) {
          grouped.set(key, {
            driverId: row.driverId,
            firstName: row.first_name,
            lastName: row.last_name,
            vehicleId: row.vehicleId,
            registrationNumber: row.registrationNumber,
            latitude: row.latitude,
            longitude: row.longitude,
            recordedAt: row.recordedAt,
            points: [],
            distance: 0,
          })
        }
        const loc = grouped.get(key)!
        loc.points.push(row)
      }

      const result: DriverLocation[] = []
      grouped.forEach((loc) => {
        loc.points.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        let dist = 0
        for (let i = 1; i < loc.points.length; i++) {
          dist += haversineDistance(
            loc.points[i - 1].latitude,
            loc.points[i - 1].longitude,
            loc.points[i].latitude,
            loc.points[i].longitude
          )
        }
        loc.distance = dist
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-card-foreground">GPS Tracking</h1>
          <p className="text-sm text-muted-foreground">ติดตามตำแหน่งรถแบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
              autoRefresh ? "border-success/30 bg-success/10 text-success" : "border-border text-muted-foreground")}>
            <RefreshCw className={cn("size-3", autoRefresh && "animate-spin")} />
            {autoRefresh ? "auto" : "off"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-card-foreground">{locations.length}</p>
          <p className="text-xs text-muted-foreground">รถที่กำลังวิ่ง</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-info">{(totalDistance / 1000).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">ระยะทางรวม (km)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-card-foreground">{locations.reduce((s, l) => s + l.points.length, 0)}</p>
          <p className="text-xs text-muted-foreground">จุดพิกัดทั้งหมด</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : locations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MapPin className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล GPS</p>
          <p className="text-xs text-muted-foreground mt-1">พลขับยังไม่ได้เปิดติดตามตำแหน่ง</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <MapComponent drivers={locations} />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-card-foreground">รายละเอียดแต่ละคัน</h3>
            </div>
            <div className="divide-y divide-border">
              {locations.map((loc) => (
                <div key={loc.driverId} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-9 rounded-full bg-info/10 text-info">
                        <Truck className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{loc.registrationNumber}</p>
                        <p className="text-xs text-muted-foreground">{loc.firstName} {loc.lastName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-card-foreground">{(loc.distance / 1000).toFixed(2)} km</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="size-3" />
                        {new Date(loc.recordedAt).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
