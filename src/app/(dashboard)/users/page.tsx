"use client"

import { useEffect, useState } from "react"
import { Users as UsersIcon, Shield, UserCheck, UserX, Pencil, Save, X, ListPlus, Trash2, Plus, Eye, FileText, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ/ผู้บังคับบัญชา",
  mechanic: "ช่างซ่อม",
  driver: "พลขับ",
}

interface UserForm {
  email: string
  password: string
  name: string
  rank: string
  firstName: string
  lastName: string
  roleId: string
  unitId: string
}

const defaultUserForm: UserForm = {
  email: "",
  password: "",
  name: "",
  rank: "",
  firstName: "",
  lastName: "",
  roleId: "",
  unitId: "",
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ rank: "", firstName: "", lastName: "", email: "", roleId: "", unitId: "", password: "", address: "", maritalStatus: "", education: "", nationalId: "", civilianLicense: "", armyLicense: "", photoUrl: "" })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [batchItems, setBatchItems] = useState<UserForm[]>([{ ...defaultUserForm }])
  const [savingBatch, setSavingBatch] = useState(false)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [uploadingUserPhoto, setUploadingUserPhoto] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchUnits()
  }, [])

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setUsers([]); setLoading(false) })
  }

  const fetchRoles = () => {
    fetch("/api/users?roles=true")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => setRoles([]))
  }

  const fetchUnits = () => {
    fetch("/api/units")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUnits(Array.isArray(data) ? data : []))
      .catch(() => setUnits([]))
  }

  const handleEdit = (u: any) => {
    setEditingId(u.id)
    setEditForm({
      rank: u.rank ?? "", firstName: u.firstName ?? "", lastName: u.lastName ?? "",
      email: u.email ?? "", roleId: u.roleId ?? "", unitId: u.unitId ?? "", password: "",
      address: u.address ?? "", maritalStatus: u.maritalStatus ?? "",
      education: u.education ?? "", nationalId: u.nationalId ?? "",
      civilianLicense: u.civilianLicense ?? "", armyLicense: u.armyLicense ?? "",
      photoUrl: u.photoUrl ?? "",
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
    setEditForm({ rank: "", firstName: "", lastName: "", email: "", roleId: "", unitId: "", password: "", address: "", maritalStatus: "", education: "", nationalId: "", civilianLicense: "", armyLicense: "", photoUrl: "" })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบผู้ใช้นี้?")) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  const openAdd = () => {
    setBatchMode(false)
    setBatchItems([{ ...defaultUserForm }])
    setShowForm(true)
  }

  const openBatchAdd = () => {
    setBatchMode(true)
    setBatchItems([{ ...defaultUserForm }])
    setShowForm(true)
  }

  const addBatchRow = () => {
    if (batchItems.length < 20) {
      setBatchItems([...batchItems, { ...defaultUserForm }])
    }
  }

  const removeBatchRow = (index: number) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter((_, i) => i !== index))
    }
  }

  const updateBatchItem = (index: number, field: keyof UserForm, value: string) => {
    setBatchItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleBatchSave = async () => {
    const validItems = batchItems.filter(
      (item) => item.email?.trim() && item.password?.trim() && item.name?.trim() && item.roleId
    )
    if (validItems.length === 0) return

    setSavingBatch(true)
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      })
      setShowForm(false)
      setBatchMode(false)
      setBatchItems([{ ...defaultUserForm }])
      fetchUsers()
    } catch {
      console.error("Failed to batch save users")
    } finally {
      setSavingBatch(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">จัดการผู้ใช้</h2>
          <p className="text-sm text-muted-foreground">รายชื่อผู้ใช้ทั้งหมด {users.length} คน</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openBatchAdd}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-card-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <ListPlus className="h-4 w-4" />
            เพิ่มหลายรายการ
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            เพิ่มผู้ใช้
          </button>
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
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.name} className="size-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <UsersIcon className="size-4" />
                          </div>
                        )}
                        <span className="font-medium text-card-foreground">{u.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingId === u.id ? (
                      <div className="space-y-1">
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="block w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
                        <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="รหัสผ่านใหม่ (ถ้าต้องการ)" className="block w-full rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
                      </div>
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
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setDetailUser(u)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="ดูรายละเอียด">
                          <Eye className="size-3.5" />
                        </button>
                        <button onClick={() => handleEdit(u)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="แก้ไข">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="ลบ">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {batchMode
                  ? `เพิ่มผู้ใช้หลายคน (${batchItems.length}/20)`
                  : "เพิ่มผู้ใช้ใหม่"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setBatchMode(false)
                }}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {batchMode ? (
                <>
                  <div className="space-y-3">
                    {batchItems.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-border bg-background/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">รายการที่ {idx + 1}</span>
                          {batchItems.length > 1 && (
                            <button
                              onClick={() => removeBatchRow(idx)}
                              className="p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">อีเมล *</label>
                            <input
                              type="email"
                              value={item.email}
                              onChange={(e) => updateBatchItem(idx, "email", e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">รหัสผ่าน *</label>
                            <input
                              type="password"
                              value={item.password}
                              onChange={(e) => updateBatchItem(idx, "password", e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="รหัสผ่าน"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">ยศ</label>
                            <input
                              type="text"
                              value={item.rank}
                              onChange={(e) => updateBatchItem(idx, "rank", e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="ยศ"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">ชื่อ *</label>
                            <input
                              type="text"
                              value={item.firstName}
                              onChange={(e) => {
                                setBatchItems((prev) => {
                                  const updated = [...prev]
                                  const newFirst = e.target.value
                                  updated[idx] = { ...updated[idx], firstName: newFirst, name: `${newFirst} ${updated[idx].lastName}`.trim() }
                                  return updated
                                })
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="ชื่อ"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">นามสกุล</label>
                            <input
                              type="text"
                              value={item.lastName}
                              onChange={(e) => {
                                setBatchItems((prev) => {
                                  const updated = [...prev]
                                  const newLast = e.target.value
                                  updated[idx] = { ...updated[idx], lastName: newLast, name: `${updated[idx].firstName} ${newLast}`.trim() }
                                  return updated
                                })
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="นามสกุล"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">บทบาท *</label>
                            <select
                              value={item.roleId}
                              onChange={(e) => updateBatchItem(idx, "roleId", e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              <option value="">-- เลือกบทบาท --</option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>{roleLabels[r.name] ?? r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">หน่วยงาน</label>
                            <select
                              value={item.unitId}
                              onChange={(e) => updateBatchItem(idx, "unitId", e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              <option value="">-- เลือกหน่วยงาน --</option>
                              {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {batchItems.length < 20 && (
                    <button
                      onClick={addBatchRow}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      เพิ่มรายการ (สูงสุด 20)
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">อีเมล *</label>
                      <input
                        type="email"
                        value={batchItems[0]?.email ?? ""}
                        onChange={(e) => updateBatchItem(0, "email", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">รหัสผ่าน *</label>
                      <input
                        type="password"
                        value={batchItems[0]?.password ?? ""}
                        onChange={(e) => updateBatchItem(0, "password", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="รหัสผ่าน"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">ยศ</label>
                      <input
                        type="text"
                        value={batchItems[0]?.rank ?? ""}
                        onChange={(e) => updateBatchItem(0, "rank", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="ยศ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">ชื่อ *</label>
                      <input
                        type="text"
                        value={batchItems[0]?.firstName ?? ""}
                        onChange={(e) => {
                          setBatchItems((prev) => {
                            const updated = [...prev]
                            const newFirst = e.target.value
                            updated[0] = { ...updated[0], firstName: newFirst, name: `${newFirst} ${updated[0].lastName}`.trim() }
                            return updated
                          })
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="ชื่อ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">นามสกุล</label>
                      <input
                        type="text"
                        value={batchItems[0]?.lastName ?? ""}
                        onChange={(e) => {
                          setBatchItems((prev) => {
                            const updated = [...prev]
                            const newLast = e.target.value
                            updated[0] = { ...updated[0], lastName: newLast, name: `${updated[0].firstName} ${newLast}`.trim() }
                            return updated
                          })
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="นามสกุล"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">บทบาท *</label>
                      <select
                        value={batchItems[0]?.roleId ?? ""}
                        onChange={(e) => updateBatchItem(0, "roleId", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">-- เลือกบทบาท --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{roleLabels[r.name] ?? r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">หน่วยงาน</label>
                      <select
                        value={batchItems[0]?.unitId ?? ""}
                        onChange={(e) => updateBatchItem(0, "unitId", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">-- เลือกหน่วยงาน --</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setBatchMode(false)
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleBatchSave}
                  disabled={
                    savingBatch ||
                    (batchMode
                      ? batchItems.every((item) => !item.email?.trim() || !item.password?.trim() || !item.name?.trim() || !item.roleId)
                      : !batchItems[0]?.email?.trim() || !batchItems[0]?.password?.trim() || !batchItems[0]?.name?.trim() || !batchItems[0]?.roleId)
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {savingBatch ? "กำลังบันทึก..." : "เพิ่มผู้ใช้"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">รายละเอียดผู้ใช้</h2>
              <button onClick={() => setDetailUser(null)} className="p-1 rounded-lg hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                {detailUser.photoUrl ? (
                  <div className="relative">
                    <img src={detailUser.photoUrl} alt={detailUser.name} className="size-16 rounded-full object-cover" />
                    <button
                      onClick={async () => {
                        if (!confirm("ลบรูปภาพนี้?")) return
                        await fetch(`/api/upload-user-photo?userId=${detailUser.id}`, { method: "DELETE" })
                        setDetailUser({ ...detailUser, photoUrl: null })
                        setUsers(users.map(u => u.id === detailUser.id ? { ...u, photoUrl: null } : u))
                      }}
                      className="absolute -bottom-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90"
                    >x</button>
                  </div>
                ) : (
                  <label className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingUserPhoto(detailUser.id)
                      const fd = new FormData()
                      fd.append("file", file)
                      fd.append("userId", detailUser.id)
                      const res = await fetch("/api/upload-user-photo", { method: "POST", body: fd })
                      const data = await res.json()
                      if (data.photoUrl) {
                        setDetailUser({ ...detailUser, photoUrl: data.photoUrl })
                        setUsers(users.map(u => u.id === detailUser.id ? { ...u, photoUrl: data.photoUrl } : u))
                      }
                      setUploadingUserPhoto(null)
                    }} />
                    {uploadingUserPhoto === detailUser.id ? "..." : "+"}
                  </label>
                )}
                <div>
                  <p className="font-semibold text-card-foreground">{detailUser.rank} {detailUser.firstName} {detailUser.lastName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[detailUser.role] ?? detailUser.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">ยศ:</span> <span className="text-card-foreground">{detailUser.rank || "-"}</span></div>
                <div><span className="text-muted-foreground">อีเมล:</span> <span className="text-card-foreground">{detailUser.email}</span></div>
                <div><span className="text-muted-foreground">ชื่อ:</span> <span className="text-card-foreground">{detailUser.firstName || "-"}</span></div>
                <div><span className="text-muted-foreground">นามสกุล:</span> <span className="text-card-foreground">{detailUser.lastName || "-"}</span></div>
                <div><span className="text-muted-foreground">หน่วยงาน:</span> <span className="text-card-foreground">{detailUser.unit || "-"}</span></div>
                <div><span className="text-muted-foreground">สถานะ:</span> <span className="text-card-foreground">{detailUser.status === "ACTIVE" ? "ใช้งาน" : "ระงับ"}</span></div>
              </div>
              <div className="pt-3 border-t border-border space-y-3">
                <h3 className="font-semibold text-card-foreground flex items-center gap-1.5"><FileText className="size-3.5" /> ข้อมูลส่วนบุคคล</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div><span className="text-muted-foreground">ที่อยู่:</span> <span className="text-card-foreground">{detailUser.address || "-"}</span></div>
                  <div><span className="text-muted-foreground">สถานภาพ:</span> <span className="text-card-foreground">{detailUser.maritalStatus || "-"}</span></div>
                  <div><span className="text-muted-foreground">การศึกษา:</span> <span className="text-card-foreground">{detailUser.education || "-"}</span></div>
                  <div><span className="text-muted-foreground">หมายเลขประชาชน:</span> <span className="text-card-foreground">{detailUser.nationalId || "-"}</span></div>
                </div>
              </div>
              <div className="pt-3 border-t border-border space-y-3">
                <h3 className="font-semibold text-card-foreground flex items-center gap-1.5"><CreditCard className="size-3.5" /> ใบอนุญาตขับขี่</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div><span className="text-muted-foreground">ใบขับขี่พลเรือน:</span> <span className="text-card-foreground">{detailUser.civilianLicense || "-"}</span></div>
                  <div><span className="text-muted-foreground">ใบขับขี่ ทบ.:</span> <span className="text-card-foreground">{detailUser.armyLicense || "-"}</span></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={() => { setEditingId(detailUser.id); setEditForm({ rank: detailUser.rank||"", firstName: detailUser.firstName||"", lastName: detailUser.lastName||"", email: detailUser.email||"", roleId: detailUser.roleId||"", unitId: detailUser.unitId||"", password: "", address: detailUser.address||"", maritalStatus: detailUser.maritalStatus||"", education: detailUser.education||"", nationalId: detailUser.nationalId||"", civilianLicense: detailUser.civilianLicense||"", armyLicense: detailUser.armyLicense||"", photoUrl: detailUser.photoUrl||"" }); setDetailUser(null) }} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Pencil className="size-3.5" /> แก้ไข</button>
              <button onClick={() => setDetailUser(null)} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Modal for Admin */}
      {editingId && !showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">แก้ไขข้อมูลผู้ใช้</h2>
              <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b border-border">
                {editForm.photoUrl ? (
                  <div className="relative">
                    <img src={editForm.photoUrl} alt="photo" className="size-16 rounded-full object-cover" />
                    <button
                      onClick={async () => {
                        if (!confirm("ลบรูปภาพนี้?")) return
                        await fetch(`/api/upload-user-photo?userId=${editingId}`, { method: "DELETE" })
                        setEditForm({ ...editForm, photoUrl: "" })
                        setUsers(users.map(u => u.id === editingId ? { ...u, photoUrl: null } : u))
                      }}
                      className="absolute -bottom-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90"
                    >x</button>
                  </div>
                ) : (
                  <label className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !editingId) return
                      const fd = new FormData()
                      fd.append("file", file)
                      fd.append("userId", editingId)
                      const res = await fetch("/api/upload-user-photo", { method: "POST", body: fd })
                      const data = await res.json()
                      if (data.photoUrl) {
                        setEditForm({ ...editForm, photoUrl: data.photoUrl })
                        setUsers(users.map(u => u.id === editingId ? { ...u, photoUrl: data.photoUrl } : u))
                      }
                    }}>+</input>
                    +
                  </label>
                )}
                <p className="text-xs text-muted-foreground">คลิกเพื่อเพิ่ม/เปลี่ยนรูป</p>
              </div>
              <h3 className="text-sm font-semibold">ข้อมูลทั่วไป</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-muted-foreground mb-1">ยศ</label><input value={editForm.rank} onChange={e=>setEditForm({...editForm,rank:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">อีเมล</label><input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">ชื่อ</label><input value={editForm.firstName} onChange={e=>setEditForm({...editForm,firstName:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">นามสกุล</label><input value={editForm.lastName} onChange={e=>setEditForm({...editForm,lastName:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">รหัสผ่านใหม่ (ถ้าต้องการ)</label><input type="password" value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="ไม่ต้องกรอกถ้าไม่เปลี่ยน" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">บทบาท</label><select value={editForm.roleId} onChange={e=>setEditForm({...editForm,roleId:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">-- เลือก --</option>{roles.map((r)=><option key={r.id} value={r.id}>{roleLabels[r.name]??r.name}</option>)}</select></div>
                <div><label className="block text-xs text-muted-foreground mb-1">หน่วยงาน</label><select value={editForm.unitId} onChange={e=>setEditForm({...editForm,unitId:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">-- เลือก --</option>{units.map((u)=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              </div>

              <h3 className="text-sm font-semibold pt-3 border-t border-border">ข้อมูลส่วนบุคคล</h3>
              <div><label className="block text-xs text-muted-foreground mb-1">ที่อยู่</label><textarea value={editForm.address} onChange={e=>setEditForm({...editForm,address:e.target.value})} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-muted-foreground mb-1">สถานภาพ</label><select value={editForm.maritalStatus} onChange={e=>setEditForm({...editForm,maritalStatus:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">-- เลือก --</option><option value="โสด">โสด</option><option value="สมรส">สมรส</option><option value="หม้าย">หม้าย</option><option value="หย่า">หย่า</option></select></div>
                <div><label className="block text-xs text-muted-foreground mb-1">การศึกษา</label><select value={editForm.education} onChange={e=>setEditForm({...editForm,education:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">-- เลือก --</option><option value="ประถมศึกษา">ประถมศึกษา</option><option value="มัธยมศึกษา">มัธยมศึกษา</option><option value="ปวช.">ปวช.</option><option value="ปวส.">ปวส.</option><option value="ปริญญาตรี">ปริญญาตรี</option><option value="ปริญญาโท">ปริญญาโท</option></select></div>
              </div>
              <div><label className="block text-xs text-muted-foreground mb-1">หมายเลขประชาชน</label><input value={editForm.nationalId} onChange={e=>setEditForm({...editForm,nationalId:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" maxLength={13} /></div>

              <h3 className="text-sm font-semibold pt-3 border-t border-border">ใบอนุญาตขับขี่</h3>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ใบขับขี่พลเรือน (เลือกได้หลายข้อ)</label>
                <div className="grid grid-cols-2 gap-1">
                  {["บ.1","บ.2","ท.1","ท.2","ท.3","ท.4","ข.1","ข.2","ข.3","ข.4"].map(v => {
                    const checked = (editForm.civilianLicense||"").split(",").filter(Boolean).includes(v)
                    return (
                      <label key={v} className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs cursor-pointer ${checked ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          const arr = (editForm.civilianLicense||"").split(",").filter(Boolean)
                          const next = checked ? arr.filter((x: string)=>x!==v) : [...arr,v]
                          setEditForm({...editForm, civilianLicense: next.join(",")})
                        }} className="rounded" />
                        {v}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ใบขับขี่ ทบ. (เลือกได้หลายข้อ)</label>
                <div className="grid grid-cols-2 gap-1">
                  {["ชนิดที่ 1","ชนิดที่ 2","ชนิดที่ 3","ชนิดที่ 4"].map(v => {
                    const checked = (editForm.armyLicense||"").split(",").filter(Boolean).includes(v)
                    return (
                      <label key={v} className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs cursor-pointer ${checked ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          const arr = (editForm.armyLicense||"").split(",").filter(Boolean)
                          const next = checked ? arr.filter((x: string)=>x!==v) : [...arr,v]
                          setEditForm({...editForm, armyLicense: next.join(",")})
                        }} className="rounded" />
                        {v}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button onClick={handleCancel} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">ยกเลิก</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
