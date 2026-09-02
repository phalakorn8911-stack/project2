"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { MapPin, Play, Square, Truck, Clock, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DriverGPSPage() {
  const [tracking, setTracking] = useState(false)
  const [status, setStatus] = useState("idle")
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [positionCount, setPositionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [driverId, setDriverId] = useState("")
  const [vehicleId, setVehicleId] = useState("")
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    fetch("/api/drivers").then(r => r.ok ? r.json() : []).then(d => setDrivers(Array.isArray(d) ? d : [])).catch(() => {})
    fetch("/api/vehicles").then(r => r.ok ? r.json() : []).then(d => setVehicles(Array.isArray(d) ? d : d?.vehicles ?? [])).catch(() => {})
  }, [])

  const sendPosition = useCallback(async (lat: number, lng: number, speed?: number, heading?: number, accuracy?: number) => {
    if (!driverId || !vehicleId) return
    try {
      await fetch("/api/gps-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          vehicleId,
          latitude: lat,
          longitude: lng,
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
        }),
      })
      setLastUpdate(new Date().toLocaleTimeString("th-TH"))
      setPositionCount(prev => prev + 1)
      setStatus("connected")
      setError(null)
    } catch {
      setStatus("error")
      setError("ไม่สามารถส่งพิกัดได้")
    }
  }, [driverId, vehicleId])

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("เบราว์เซอร์ไม่รองรับ GPS")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.speed ?? undefined, pos.coords.heading ?? undefined, pos.coords.accuracy)
      },
      (err) => {
        setError("ไม่สามารถเข้าถึงตำแหน่งได้: " + err.message)
        setStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [sendPosition])

  const startTracking = () => {
    if (!driverId || !vehicleId) {
      setError("กรุณาเลือกพลขับและรถ")
      return
    }
    setTracking(true)
    setPositionCount(0)
    setError(null)
    getCurrentPosition()
    intervalRef.current = setInterval(getCurrentPosition, 5 * 60 * 1000)
  }

  const stopTracking = () => {
    setTracking(false)
    setStatus("idle")
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-green-900 to-green-800 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold">ติดตามตำแหน่ง</h1>
          <p className="text-sm text-green-200">ระบบส่งพิกัดอัตโนมัติทุก 5 นาที</p>
        </div>

        <div className="rounded-xl bg-white/10 backdrop-blur p-4 space-y-3">
          <div>
            <label className="block text-xs text-green-200 mb-1">พลขับ</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} disabled={tracking}
              className="w-full rounded-lg bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-green-300 disabled:opacity-50">
              <option value="" className="text-gray-900">-- เลือกพลขับ --</option>
              {drivers.map((d: any) => <option key={d.id} value={d.id} className="text-gray-900">{d.rank} {d.firstName} {d.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-green-200 mb-1">รถ</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={tracking}
              className="w-full rounded-lg bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-green-300 disabled:opacity-50">
              <option value="" className="text-gray-900">-- เลือกรถ --</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id} className="text-gray-900">{v.registrationNumber} - {v.model}</option>)}
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-white/10 backdrop-blur p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("size-3 rounded-full", tracking ? "bg-green-400 animate-pulse" : "bg-gray-400")} />
            <span className="text-sm text-white font-medium">
              {tracking ? "กำลังติดตาม..." : "หยุด"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-green-200">
            <div>สถานะ: <span className="text-white">{status === "connected" ? "เชื่อมต่อแล้ว" : status === "error" ? "ข้อผิดพลาด" : "รอเริ่ม"}</span></div>
            <div>พิกัด: <span className="text-white">{positionCount} ครั้ง</span></div>
            {lastUpdate && <div>อัพเดทล่าสุด: <span className="text-white">{lastUpdate}</span></div>}
          </div>
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>

        <div className="flex gap-3">
          {!tracking ? (
            <button onClick={startTracking} disabled={!driverId || !vehicleId}
              className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors",
                driverId && vehicleId ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-500/50 text-gray-300 cursor-not-allowed")}>
              <Play className="size-4" /> เริ่มติดตาม
            </button>
          ) : (
            <button onClick={stopTracking}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600 transition-colors">
              <Square className="size-4" /> หยุด
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
