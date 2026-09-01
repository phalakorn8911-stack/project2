"use client"

import { useSession, signOut } from "next-auth/react"
import { Bell, LogOut, ChevronDown, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ/ผู้บังคับบัญชา",
  mechanic: "ช่างซ่อม",
  driver: "พลขับ",
}

export function Header() {
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch("/api/notifications").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/parts/alerts").then((r) => (r.ok ? r.json() : { lowStock: [] })),
    ])
      .then(([notifData, alertData]) => {
        const list = Array.isArray(notifData) ? notifData : []
        const unread = list.filter((n: any) => !n.read).length
        const lowStock = (alertData.lowStock ?? []).length
        setUnreadCount(unread + lowStock)
      })
      .catch(() => setUnreadCount(0))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu])

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-foreground">
            สถานภาพยานยนต์ ร.153 พัน.3
        </h1>
        <span className="hidden sm:inline text-sm text-muted-foreground">
          {formatDate(new Date())}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {session?.user?.name?.charAt(0) ?? <User className="size-3.5" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">
                {session?.user?.name ?? "ผู้ใช้"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {roleLabels[session?.user?.role ?? ""] ?? "ไม่มีสิทธิ์"}
              </p>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border mb-1">
                {session?.user?.email ?? "ไม่ระบุอีเมล"}
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="size-4" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
