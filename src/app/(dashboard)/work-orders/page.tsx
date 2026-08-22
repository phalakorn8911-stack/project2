"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

type WorkOrderStatus = "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED"

interface WorkOrder {
  id: string
  woNumber: string
  vehicleRegistration: string
  issueDescription: string
  mechanicName: string
  urgency: string
  status: WorkOrderStatus
}

const statusConfig: Record<WorkOrderStatus, { label: string; color: string }> = {
  OPEN: { label: "รอรับงาน", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "กำลังซ่อม", color: "bg-yellow-100 text-yellow-700" },
  WAITING_PARTS: { label: "รออะไหล่", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "ซ่อมเสร็จ", color: "bg-green-100 text-green-700" },
}

const statusOptions: { value: WorkOrderStatus; label: string }[] = [
  { value: "OPEN", label: "รอรับงานซ่อม" },
  { value: "IN_PROGRESS", label: "กำลังซ่อม" },
  { value: "WAITING_PARTS", label: "รออะไหล่" },
  { value: "COMPLETED", label: "ซ่อมเสร็จแล้ว" },
]

const columns: { key: WorkOrderStatus; title: string }[] = [
  { key: "OPEN", title: "รอรับงาน" },
  { key: "IN_PROGRESS", title: "กำลังซ่อม" },
  { key: "WAITING_PARTS", title: "รออะไหล่" },
  { key: "COMPLETED", title: "ซ่อมเสร็จ" },
]

const urgencyColor: Record<string, string> = {
  สูง: "bg-red-100 text-red-700",
  ปานกลาง: "bg-yellow-100 text-yellow-700",
  ต่ำ: "bg-gray-100 text-gray-700",
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch("/api/work-orders")
      const data = await res.json()
      setWorkOrders(data)
    } catch (error) {
      console.error("Failed to fetch work orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const updateStatus = async (id: string, newStatus: WorkOrderStatus) => {
    try {
      await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchWorkOrders()
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setOpenDropdown(null)
    }
  }

  const getOrdersByStatus = (status: WorkOrderStatus) =>
    workOrders.filter((wo) => wo.status === status)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ใบงานซ่อม</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {getOrdersByStatus(col.key).length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {getOrdersByStatus(col.key).map((wo) => (
                  <div
                    key={wo.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{wo.woNumber}</span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenDropdown(openDropdown === wo.id ? null : wo.id)
                          }
                          className={cn(
                            "flex items-center gap-1 text-xs rounded-full px-2 py-1 cursor-pointer transition-colors",
                            statusConfig[wo.status].color,
                            "hover:opacity-80"
                          )}
                        >
                          {statusConfig[wo.status].label}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdown === wo.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover shadow-md">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateStatus(wo.id, opt.value)}
                                className={cn(
                                  "w-full text-left text-sm px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-lg last:rounded-b-lg",
                                  wo.status === opt.value && "font-semibold bg-accent"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {wo.vehicleRegistration}
                    </p>
                    <p className="text-sm mb-2">{wo.issueDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {wo.mechanicName}
                      </span>
                      <span
                        className={cn(
                          "text-xs rounded-full px-2 py-0.5",
                          urgencyColor[wo.urgency] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {wo.urgency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
