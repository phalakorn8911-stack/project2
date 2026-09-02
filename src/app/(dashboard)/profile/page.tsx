"use client"

import { useEffect, useState } from "react"
import { User, Save, Lock, Shield, Building, Eye, EyeOff, CheckCircle, MapPin, GraduationCap, CreditCard, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแลระบบ/ผู้บังคับบัญชา",
  mechanic: "ช่างซ่อม",
  driver: "พลขับ",
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", rank: "",
    address: "", maritalStatus: "", education: "",
    nationalId: "", civilianLicense: "", armyLicense: "",
    newPassword: "", confirmPassword: "",
  })

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setProfile(data)
          setForm({
            firstName: data.firstName || "", lastName: data.lastName || "",
            email: data.email || "", rank: data.rank || "",
            address: data.address || "", maritalStatus: data.maritalStatus || "",
            education: data.education || "", nationalId: data.nationalId || "",
            civilianLicense: data.civilianLicense || "", armyLicense: data.armyLicense || "",
            newPassword: "", confirmPassword: "",
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true); setMessage(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, rank: form.rank,
          address: form.address, maritalStatus: form.maritalStatus,
          education: form.education, nationalId: form.nationalId,
          civilianLicense: form.civilianLicense, armyLicense: form.armyLicense,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" }); setSaving(false); return }
      setMessage({ type: "success", text: "บันทึกข้อมูลสำเร็จ" })
      setProfile((p: any) => ({ ...p, ...data.user }))
    } catch { setMessage({ type: "error", text: "เชื่อมต่อไม่ได้" }) }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setSaving(true); setMessage(null)
    if (!form.newPassword) { setMessage({ type: "error", text: "กรุณากรอกรหัสผ่าน" }); setSaving(false); return }
    if (form.newPassword.length < 4) { setMessage({ type: "error", text: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" }); setSaving(false); return }
    if (form.newPassword !== form.confirmPassword) { setMessage({ type: "error", text: "รหัสผ่านใหม่ไม่ตรงกัน" }); setSaving(false); return }
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" }); setSaving(false); return }
      setMessage({ type: "success", text: "เปลี่ยนรหัสผ่านสำเร็จ" })
      setForm(f => ({ ...f, newPassword: "", confirmPassword: "" }))
    } catch { setMessage({ type: "error", text: "เชื่อมต่อไม่ได้" }) }
    setSaving(false)
  }

  if (loading) return <div className="p-4 md:p-6"><div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">กำลังโหลด...</div></div>

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground">ข้อมูลส่วนตัว</h2>
        <p className="text-sm text-muted-foreground">แก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน</p>
      </div>

      {message && (
        <div className={cn("rounded-lg px-4 py-3 text-sm flex items-center gap-2",
          message.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          {message.type === "success" ? <CheckCircle className="size-4" /> : <span>⚠</span>}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold text-card-foreground">{form.rank} {form.firstName} {form.lastName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Shield className="size-3.5" /> {roleLabels[profile?.role] || profile?.role}</p>
            {profile?.unit && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Building className="size-3.5" /> {profile?.unit}</p>}
          </div>
        </div>

        {/* ข้อมูลทั่วไป */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2"><User className="size-4" /> ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">ยศ</label>
              <input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="เช่น สิบเอก" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">อีเมล</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">ชื่อ</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">นามสกุล</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
            </div>
          </div>
        </div>

        {/* ข้อมูลส่วนบุคคล */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2"><FileText className="size-4" /> ข้อมูลส่วนบุคคล</h3>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">ที่อยู่</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="ที่อยู่ปัจจุบัน" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">สถานภาพ</label>
              <select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">-- เลือก --</option>
                <option value="โสด">โสด</option>
                <option value="สมรส">สมรส</option>
                <option value="หม้าย">หม้าย</option>
                <option value="หย่า">หย่า</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">การศึกษา</label>
              <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">-- เลือก --</option>
                <option value="ประถมศึกษา">ประถมศึกษา</option>
                <option value="มัธยมศึกษา">มัธยมศึกษา</option>
                <option value="ปวช.">ปวช.</option>
                <option value="ปวส.">ปวส.</option>
                <option value="อนุปริญญา">อนุปริญญา</option>
                <option value="ปริญญาตรี">ปริญญาตรี</option>
                <option value="ปริญญาโท">ปริญญาโท</option>
                <option value="ปริญญาเอก">ปริญญาเอก</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">หมายเลขประชาชน</label>
            <input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="13 หลัก" maxLength={13} />
          </div>
        </div>

        {/* ใบอนุญาตขับขี่ */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2"><CreditCard className="size-4" /> ใบอนุญาตขับขี่</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">ใบขับขี่พลเรือน ประเภท</label>
              <select value={form.civilianLicense} onChange={(e) => setForm({ ...form, civilianLicense: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">-- เลือก --</option>
                <option value="ท">ท. รถยนต์นั่งส่วนบุคคลไม่เกิน 7 คนนั่ง</option>
                <option value="ท2">ท2. รถยนต์นั่งส่วนบุคคลเกิน 7 คนนั่ง</option>
                <option value="ท3">ท3. รถยนต์บรรทุกส่วนบุคคล</option>
                <option value="ท4">ท4. รถยนต์บรรทุกสาธารณะ</option>
                <option value="จ">จ. รถจักรยานยนต์</option>
                <option value="ข">ข. รถแทรกเตอร์</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">ใบขับขี่ ทบ. ประเภท</label>
              <select value={form.armyLicense} onChange={(e) => setForm({ ...form, armyLicense: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">-- เลือก --</option>
                <option value="ทบ.1">ทบ.1 รถยนต์ขนาดเล็ก</option>
                <option value="ทบ.2">ทบ.2 รถยนต์ขนาดกลาง</option>
                <option value="ทบ.3">ทบ.3 รถยนต์ขนาดใหญ่</option>
                <option value="ทบ.4">ทบ.4 รถหุ้มเกราะ</option>
                <option value="ทบ.5">ทบ.5 รถถัง</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Save className="size-4" /> บันทึกข้อมูล
        </button>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2"><Lock className="size-4" /> เปลี่ยนรหัสผ่าน</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">รหัสผ่านใหม่</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="อย่างน้อย 4 ตัวอักษร" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">ยืนยันรหัสผ่านใหม่</label>
            <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" />
          </div>
          <button onClick={handleChangePassword} disabled={saving || !form.newPassword || !form.confirmPassword} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            <Lock className="size-4" /> เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </div>
    </div>
  )
}
