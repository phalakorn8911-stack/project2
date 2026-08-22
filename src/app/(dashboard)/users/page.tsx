"use client"

import { useEffect, useState } from "react"
import { Users as UsersIcon, Shield, UserCheck, UserX, Pencil, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  commander: "ผู้บังคับบัญชา",
  vehicle_officer: "เจ้าหน้าที่ยานยนต์",
  driver: "พลขับ",
  mechanic: "ช่างซ่อม",
  head_mechanic: "หัวหน้าช่าง",
  parts_officer: "เจ้าหน้าที่คลังอะไหล่",
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ rank: "", firstName: "", lastName: "", email: "", roleId: "", unitId: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchUnits()
  }, [])

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const fetchRoles = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const uniqueRoles: Record<string, string> = {}
        data.forEach((u: any) => { if (u.roleId) uniqueRoles[u.roleId] = u.role })
        setRoles(Object.entries(uniqueRoles).map(([id, name]) => ({ id, name })))
      })
      .catch(() => {})
  }

  const fetchUnits = () => {
    fetch("/api/units")
      .then((r) => r.json())
      .then((data) => setUnits(data))
      .catch(() => {})
  }

  const handleEdit = (u: any) => {
    setEditingId(u.id)
    setEditForm({
      rank: u.rank ?? "",
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      email: u.email ?? "",
      roleId: u.roleId ?? "",
      unitId: u.unitId ?? "",
    })
  }

  const handleSave = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await fetch(`/api/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      fetchUsers()
      setEditingId(null)
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ rank: "", firstName: "", lastName: "", email: "", roleId: "", unitId: "" })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">จัดการผู้ใช้</h2>
          <p className="text-sm text-muted-foreground">รายชื่อผู้ใช้ทั้งหมด {users.length} คน</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">ยศ</th>
                <th className="px-3 py-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-3 py-3 font-medium">อีเมล</th>
                <th className="px-3 py-3 font-medium">บทบาท</th>
                <th className="px-3 py-3 font-medium">หน่วยงาน</th>
                <th className="px-3 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-card-foreground">
                    {editingId === u.id ? (
                      <input type="text" value={editForm.rank} onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })} className="block w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
                    ) : (
                      u.rank || "-"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-1">
                        <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="ชื่อ" className="block w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
                        <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="นามสกุล" className="block w-24 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <UsersIcon className="size-4" />
                        </div>
                        <span className="font-medium text-card-foreground">{u.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === u.id ? (
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="block w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
                    ) : (
                      <span className="text-muted-foreground">{u.email}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === u.id ? (
                      <select value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })} className="block w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
                        <option value="">-- เลือกบทบาท --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{roleLabels[r.name] ?? r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Shield className="size-3" />
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === u.id ? (
                      <select value={editForm.unitId} onChange={(e) => setEditForm({ ...editForm, unitId: e.target.value })} className="block w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
                        <option value="">-- เลือกหน่วยงาน --</option>
                        {units.map((un) => (
                          <option key={un.id} value={un.id}>{un.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground">{u.unit}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      u.status === "ACTIVE" ? "text-success bg-success/10" : "text-muted-foreground bg-muted"
                    )}>
                      {u.status === "ACTIVE" ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                      {u.status === "ACTIVE" ? "ใช้งาน" : "ระงับ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === u.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center size-7 rounded-lg text-success hover:bg-success/10 transition-colors" title="บันทึก">
                          <Save className="size-3.5" />
                        </button>
                        <button onClick={handleCancel} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="ยกเลิก">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(u)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="แก้ไข">
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
