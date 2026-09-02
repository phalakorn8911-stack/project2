"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Truck,
  ClipboardCheck,
  Wrench,
  Package,
  FileBarChart,
  Bot,
  Settings,
  Bell,
  Users,
  UserCog,
  Tags,
  Building,
  ChevronLeft,
  MapPin,
  UserCircle,
  Download,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  roles?: string[]
}

const mainNav: NavItem[] = [
  { label: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { label: "ยานพาหนะ", href: "/vehicles", icon: Truck },
  { label: "ประเภทรถ", href: "/vehicle-types", icon: Tags, roles: ["admin"] },
  { label: "หน่วยงาน", href: "/units", icon: Building, roles: ["admin"] },
  { label: "คนขับรถ", href: "/drivers", icon: UserCog, roles: ["admin", "mechanic"] },
  { label: "แผนซ่อมบำรุง", href: "/maintenance-plans", icon: ClipboardCheck, roles: ["admin", "mechanic"] },
  { label: "ใบงานซ่อม", href: "/work-orders", icon: Wrench, roles: ["admin", "mechanic"] },
  { label: "คลังอะไหล่", href: "/parts", icon: Package, roles: ["admin", "mechanic"] },
  { label: "รายงาน", href: "/reports", icon: FileBarChart, roles: ["admin", "mechanic"] },
  { label: "ติดตามรถ GPS", href: "/gps-tracking", icon: MapPin, roles: ["admin"] },
  { label: "ผู้ช่วย AI", href: "/ai-assistant", icon: Bot },
]

const secondaryNav: NavItem[] = [
  { label: "ข้อมูลส่วนตัว", href: "/profile", icon: UserCircle },
  { label: "ดาวน์โหลดแอป", href: "/download", icon: Download },
  { label: "การแจ้งเตือน", href: "/notifications", icon: Bell },
  { label: "จัดการผู้ใช้", href: "/users", icon: Users, roles: ["admin"] },
  { label: "ตั้งค่า", href: "/settings", icon: Settings, roles: ["admin"] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const userRole = (session?.user as any)?.role as string | undefined

  const canSee = (item: NavItem) => !item.roles || item.roles.includes(userRole ?? "")

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 z-50",
          collapsed ? "w-16" : "w-60",
          "max-md:fixed max-md:inset-y-0 max-md:left-0",
          open ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
            ยนต.
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              สถานภาพยานยนต์ ร.153 พัน.3
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 py-1.5 text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                หลัก
              </p>
            )}
            {mainNav.filter(canSee).map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
                collapsed={collapsed}
                onClick={onClose}
              />
            ))}
          </div>

          <div className="pt-3 space-y-0.5">
            {!collapsed && (
              <p className="px-3 py-1.5 text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                ระบบ
              </p>
            )}
            {secondaryNav.filter(canSee).map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
                collapsed={collapsed}
                onClick={onClose}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-2">
          {!collapsed && session?.user && (
            <Link href="/profile" onClick={onClose} className="flex items-center gap-2 rounded-lg px-3 py-2 mb-1 hover:bg-sidebar-accent/50 transition-colors">
              {(session.user as any).photoUrl ? (
                <img src={(session.user as any).photoUrl} alt="" className="size-7 rounded-full object-cover" />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground/60 text-xs">
                  {(session.user as any).firstName?.[0] || (session.user.name?.[0]) || "?"}
                </div>
              )}
              <span className="text-xs text-sidebar-foreground/70 truncate">{(session.user as any).rank} {(session.user as any).firstName || session.user.name}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform duration-200",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && <span>ย่อ</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}
