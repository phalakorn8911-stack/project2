"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { MapPin, Play, Square, Truck, Clock, Wifi, WifiOff, Battery, Signal, ChevronDown, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DriverGPSPage() {
  const [tracking, setTracking] = useState(false)
  const [status, setStatus] = useState<"idle" | "connected" | "error">("idle")
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [positionCount, setPositionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [driverId, setDriverId] = useState("")
  const [vehicleId, setVehicleId] = useState("")
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedDriverName, setSelectedDriverName] = useState("")
  const [selectedVehicleName, setSelectedVehicleName] = useState("")
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [battery, setBattery] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch("/api/drivers").then(r => r.ok ? r.json() : []).then(d => setDrivers(Array.isArray(d) ? d : [])).catch(() => {})
    fetch("/api/vehicles").then(r => r.ok ? r.json() : []).then(d => setVehicles(Array.isArray(d) ? d : d?.vehicles ?? [])).catch(() => {})

    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        setBattery(Math.round(b.level * 100))
        b.addEventListener("levelchange", () => setBattery(Math.round(b.level * 100)))
      }).catch(() => {})
    }
  }, [])

  const sendPosition = useCallback(async (lat: number, lng: number, speed?: number, heading?: number, acc?: number) => {
    if (!driverId || !vehicleId) return
    try {
      await fetch("/api/gps-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, vehicleId, latitude: lat, longitude: lng, speed: speed || 0, heading: heading || 0, accuracy: acc || 0 }),
      })
      setLastUpdate(new Date().toLocaleTimeString("th-TH"))
      setPositionCount(prev => prev + 1)
      setStatus("connected")
      setAccuracy(acc ?? null)
      setError(null)
    } catch {
      setStatus("error")
      setError("ไม่สามารถส่งพิกัดได้ - ตรวจสอบอินเทอร์เน็ต")
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
        setError(err.code === 1 ? "กรุณาเปิดสิทธิ์ location" : err.code === 2 ? "ไม่สามารถระบุตำแหน่งได้" : "หมดเวลาขอข้อมูลตำแหน่ง")
        setStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [sendPosition])

  const startTracking = () => {
    if (!driverId || !vehicleId) { setError("กรุณาเลือกพลขับและรถ"); return }
    setTracking(true)
    setPositionCount(0)
    setError(null)
    getCurrentPosition()
    intervalRef.current = setInterval(getCurrentPosition, 5 * 60 * 1000)
  }

  const stopTracking = () => {
    setTracking(false)
    setStatus("idle")
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-emerald-800/80 backdrop-blur-lg border-b border-emerald-700/50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <MapPin className="size-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">ระบบติดตาม GPS</h1>
              <p className="text-[10px] text-emerald-200">ระบบติดตามตำแหน่งรถ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-200">
            {tracking && (
              <>
                <div className="flex items-center gap-1 text-[10px]">
                  <Signal className="size-3" />
                  <span>{accuracy ? `${Math.round(accuracy)}m` : "-"}</span>
                </div>
                {battery !== null && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <Battery className="size-3" />
                    <span>{battery}%</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Status Card */}
        <div className={cn(
          "rounded-2xl p-5 border transition-all duration-300",
          tracking ? "bg-emerald-600/30 border-emerald-500/50 shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/10"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("size-10 rounded-full flex items-center justify-center transition-colors",
              tracking ? "bg-emerald-500" : "bg-white/10"
            )}>
              {tracking ? <Wifi className="size-5 text-white animate-pulse" /> : <WifiOff className="size-5 text-emerald-300" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{tracking ? "กำลังติดตาม" : "หยุดทำงาน"}</p>
              <p className="text-xs text-emerald-200">
                {tracking ? "ส่งพิกัดทุก 5 นาทีอัตโนมัติ" : "กดปุ่มเพื่อเริ่มติดตาม"}
              </p>
            </div>
          </div>

          {tracking && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-700/40 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-white">{positionCount}</p>
                <p className="text-[10px] text-emerald-200">จุดพิกัด</p>
              </div>
              <div className="bg-emerald-700/40 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-white">{lastUpdate || "-"}</p>
                <p className="text-[10px] text-emerald-200">อัพเดทล่าสุด</p>
              </div>
              <div className="bg-emerald-700/40 rounded-xl p-3 text-center">
                <p className={cn("text-lg font-bold", status === "connected" ? "text-emerald-300" : status === "error" ? "text-red-400" : "text-white")}>
                  {status === "connected" ? "เชื่อมต่อ" : status === "error" ? "ผิดพลาด" : "รอ"}
                </p>
                <p className="text-[10px] text-emerald-200">สถานะ</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Selection */}
        {!tracking && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs font-medium text-emerald-200 mb-2">เลือกพลขับ</label>
              <div className="relative">
                <select value={driverId} onChange={(e) => {
                  const opt = e.target.options[e.target.selectedIndex]
                  setDriverId(e.target.value)
                  setSelectedDriverName(opt.text.includes("--") ? "" : opt.text)
                }}
                  className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
                  <option value="" className="text-gray-900">-- เลือกพลขับ --</option>
                  {drivers.map((d: any) => <option key={d.id} value={d.id} className="text-gray-900">{d.rank} {d.firstName} {d.lastName}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-300 pointer-events-none" />
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs font-medium text-emerald-200 mb-2">เลือกรถ</label>
              <div className="relative">
                <select value={vehicleId} onChange={(e) => {
                  const opt = e.target.options[e.target.selectedIndex]
                  setVehicleId(e.target.value)
                  setSelectedVehicleName(opt.text.includes("--") ? "" : opt.text)
                }}
                  className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
                  <option value="" className="text-gray-900">-- เลือกรถ --</option>
                  {vehicles.map((v: any) => <option key={v.id} value={v.id} className="text-gray-900">{v.registrationNumber} - {v.model}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-300 pointer-events-none" />
              </div>
            </div>

            {selectedDriverName && selectedVehicleName && (
              <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle className="size-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-200">
                  <span className="font-medium text-white">{selectedDriverName}</span>
                  <span className="mx-1">•</span>
                  <span className="font-medium text-white">{selectedVehicleName}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button onClick={tracking ? stopTracking : startTracking}
          disabled={!tracking && (!driverId || !vehicleId)}
          className={cn(
            "w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold transition-all duration-200 shadow-lg",
            tracking
              ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30 active:scale-95"
              : driverId && vehicleId
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30 active:scale-95"
                : "bg-white/10 text-emerald-300/50 cursor-not-allowed shadow-none"
          )}>
          {tracking ? (
            <><Square className="size-5" /> หยุดติดตาม</>
          ) : (
            <><Play className="size-5" /> เริ่มติดตาม</>
          )}
        </button>

        {/* Info */}
        <div className="text-center space-y-1 pb-6">
          <p className="text-[10px] text-emerald-300/60">ระบบจะส่งพิกัดอัตโนมัติทุก 5 นาที</p>
          <p className="text-[10px] text-emerald-300/60">เปิดหน้านี้ค้างไว้ขณะขับรถ</p>
        </div>
      </div>
    </div>
  )
}
