"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  ChevronLeft,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const mainNav: NavItem[] = [
  { label: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { label: "ยานพาหนะ", href: "/vehicles", icon: Truck },
  { label: "แผนซ่อมบำรุง", href: "/maintenance-plans", icon: ClipboardCheck },
  { label: "ใบงานซ่อม", href: "/work-orders", icon: Wrench },
  { label: "คลังอะไหล่", href: "/parts", icon: Package },
  { label: "รายงาน", href: "/reports", icon: FileBarChart },
  { label: "ผู้ช่วย AI", href: "/ai-assistant", icon: Bot },
]

const secondaryNav: NavItem[] = [
  { label: "การแจ้งเตือน", href: "/notifications", icon: Bell },
  { label: "จัดการผู้ใช้", href: "/users", icon: Users },
  { label: "ตั้งค่า", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
          สบ.
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground truncate">
            ระบบยานพาหนะ
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
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div className="pt-3 space-y-0.5">
          {!collapsed && (
            <p className="px-3 py-1.5 text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
              ระบบ
            </p>
          )}
          {secondaryNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
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
  )
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
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
