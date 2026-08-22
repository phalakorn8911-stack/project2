"use client"

import { useEffect, useState } from "react"
import { Settings, User, Shield, Pencil, Save, X, Plus, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Admin {
  id: string
  name: string
  email: string
  rank?: string
  firstName?: string
  lastName?: string
  role: string
  roleId?: string
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [adminRoleId, setAdminRoleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Admin> & { password?: string }>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    rank: "",
    firstName: "",
    lastName: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้")
      const data = await res.json()
      const users = data.users || data
      if (Array.isArray(users)) {
        const adminList = users.filter((u: any) => u.role === "admin")
        setAdmins(adminList)
        const foundAdmin = adminList.find((a: any) => a.roleId)
        if (foundAdmin?.roleId) {
          setAdminRoleId(foundAdmin.roleId)
        } else {
          const anyUser = users.find((u: any) => u.roleId)
          if (anyUser?.roleId) setAdminRoleId(anyUser.roleId)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleEdit = (admin: Admin) => {
    setEditingId(admin.id)
    setEditForm({
      name: admin.name,
      email: admin.email,
      rank: admin.rank || "",
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      password: "",
    })
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setError(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name || !editForm.email) {
      setError("กรุณากรอกชื่อและอีเมล")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        rank: editForm.rank,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
      }
      if (editForm.password) {
        payload.password = editForm.password
      }
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "ไม่สามารถอัปเดตข้อมูลได้")
      }
      setEditingId(null)
      setEditForm({})
      await fetchAdmins()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      setError("กรุณากรอกชื่อ อีเมล และรหัสผ่าน")
      return
    }
    if (admins.length >= 2) {
      setError("ไม่สามารถเพิ่มผู้ดูแลระบบได้เกิน 2 คน")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        rank: addForm.rank,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
      }
      if (adminRoleId) {
        payload.roleId = adminRoleId
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "ไม่สามารถเพิ่มผู้ดูแลระบบได้")
      }
      setShowAddForm(false)
      setAddForm({ name: "", email: "", password: "", rank: "", firstName: "", lastName: "" })
      await fetchAdmins()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">ตั้งค่าระบบ</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">ข้อมูลผู้ดูแลระบบ</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                ผู้ดูแลระบบ {admins.length}/2 คน
              </span>
              <button
                onClick={() => {
                  setShowAddForm(true)
                  setError(null)
                }}
                disabled={admins.length >= 2 || saving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  admins.length >= 2
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Plus className="h-4 w-4" />
                เพิ่ม Admin
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">เพิ่ม Admin ใหม่</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">อีเมล *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">รหัสผ่าน *</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={addForm.rank}
                    onChange={(e) => setAddForm({ ...addForm, rank: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">ชื่อจริง</label>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setAddForm({ name: "", email: "", password: "", rank: "", firstName: "", lastName: "" })
                    setError(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddAdmin}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">กำลังโหลด...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">ไม่พบข้อมูลผู้ดูแลระบบ</div>
          ) : (
            <div className="grid gap-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="border border-border rounded-xl p-4 space-y-3"
                >
                  {editingId === admin.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">ชื่อ</label>
                          <input
                            type="text"
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">อีเมล</label>
                          <input
                            type="email"
                            value={editForm.email || ""}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">รหัสผ่าน (ไม่บังคับ)</label>
                          <input
                            type="password"
                            value={editForm.password || ""}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            placeholder="ปล่อยว่างหากไม่เปลี่ยน"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">ตำแหน่ง</label>
                          <input
                            type="text"
                            value={editForm.rank || ""}
                            onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">ชื่อจริง</label>
                          <input
                            type="text"
                            value={editForm.firstName || ""}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">นามสกุล</label>
                          <input
                            type="text"
                            value={editForm.lastName || ""}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
                        >
                          <X className="h-4 w-4" />
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => handleSaveEdit(admin.id)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                          {admin.rank && (
                            <p className="text-xs text-muted-foreground">ตำแหน่ง: {admin.rank}</p>
                          )}
                          {(admin.firstName || admin.lastName) && (
                            <p className="text-xs text-muted-foreground">
                              ชื่อ: {admin.firstName} {admin.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(admin)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        แก้ไข
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
