"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (!dismissed) setShowInstall(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShowInstall(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstall(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showInstall || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">ติดตั้งแอป</p>
            <p className="mt-1 text-xs text-muted-foreground">เพิ่มลงหน้าจอหลักเพื่อเข้าถึงได้สะดวก</p>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={handleInstall} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Download className="size-3.5" /> ติดตั้ง
          </button>
          <button onClick={handleDismiss} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            ภายหลัง
          </button>
        </div>
      </div>
    </div>
  )
}
