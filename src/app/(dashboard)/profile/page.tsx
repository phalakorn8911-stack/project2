"use client"

import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setProfile(d)
        setForm({
          firstName: d.firstName || "", lastName: d.lastName || "",
          email: d.email || "", rank: d.rank || "",
          address: d.address || "", maritalStatus: d.maritalStatus || "",
          education: d.education || "", nationalId: d.nationalId || "",
          civilianLicense: d.civilianLicense || "", armyLicense: d.armyLicense || "",
          newPassword: "", confirmPassword: "",
        })
        setLoading(false)
      })
      .catch(() => { setError("เชื่อมต่อไม่ได้"); setLoading(false) })
  }, [])

  const save = async () => {
    setSaving(true); setMsg("")
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (res.ok) { setMsg("บันทึกสำเร็จ"); setProfile({...profile, ...d.user}) }
    else setMsg(d.error || "ผิดพลาด")
    setSaving(false)
  }

  const changePw = async () => {
    if (!form.newPassword || form.newPassword !== form.confirmPassword) { setMsg("รหัสผ่านไม่ตรงกัน"); return }
    setSaving(true); setMsg("")
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.newPassword }),
    })
    const d = await res.json()
    setMsg(res.ok ? "เปลี่ยนรหัสผ่านสำเร็จ" : d.error || "ผิดพลาด")
    if (res.ok) setForm({...form, newPassword: "", confirmPassword: ""})
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-center text-muted-foreground">กำลังโหลด...</div>
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>

  const i = "w-full rounded border px-3 py-2 text-sm bg-background border-input"

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-lg font-bold">ข้อมูลส่วนตัว</h2>

      {msg && <div className={`p-3 rounded text-sm ${msg.includes("สำเร็จ") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{msg}</div>}

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          {profile.photoUrl ? (
            <label className="relative cursor-pointer">
              <img src={profile.photoUrl} alt="photo" className="size-20 rounded-full object-cover" />
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return
                const fd = new FormData(); fd.append("file", file); fd.append("userId", profile.id)
                const res = await fetch("/api/upload-user-photo", { method: "POST", body: fd })
                const d = await res.json()
                if (d.photoUrl) { setProfile({...profile, photoUrl: d.photoUrl}); setMsg("เปลี่ยนรูปสำเร็จ") }
              }} />
              <span className="absolute bottom-0 right-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">+</span>
            </label>
          ) : (
            <label className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return
                const fd = new FormData(); fd.append("file", file); fd.append("userId", profile.id)
                const res = await fetch("/api/upload-user-photo", { method: "POST", body: fd })
                const d = await res.json()
                if (d.photoUrl) { setProfile({...profile, photoUrl: d.photoUrl}); setMsg("เปลี่ยนรูปสำเร็จ") }
              }} />
              <span className="text-2xl">+</span>
            </label>
          )}
          <div>
            <p className="font-semibold">{profile.rank} {profile.firstName} {profile.lastName}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <h3 className="font-semibold">ข้อมูลทั่วไป</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground">ยศ</label><input value={form.rank||""} onChange={e=>setForm({...form,rank:e.target.value})} className={i} /></div>
          <div><label className="text-xs text-muted-foreground">อีเมล</label><input value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} className={i} /></div>
          <div><label className="text-xs text-muted-foreground">ชื่อ</label><input value={form.firstName||""} onChange={e=>setForm({...form,firstName:e.target.value})} className={i} /></div>
          <div><label className="text-xs text-muted-foreground">นามสกุล</label><input value={form.lastName||""} onChange={e=>setForm({...form,lastName:e.target.value})} className={i} /></div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold">ข้อมูลส่วนบุคคล</h3>
        <div><label className="text-xs text-muted-foreground">ที่อยู่</label><textarea value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} rows={2} className={i} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">สถานภาพ</label>
            <select value={form.maritalStatus||""} onChange={e=>setForm({...form,maritalStatus:e.target.value})} className={i}>
              <option value="">-- เลือก --</option>
              <option value="โสด">โสด</option>
              <option value="สมรส">สมรส</option>
              <option value="หม้าย">หม้าย</option>
              <option value="หย่า">หย่า</option>
            </select>
          </div>
          <div><label className="text-xs text-muted-foreground">การศึกษา</label>
            <select value={form.education||""} onChange={e=>setForm({...form,education:e.target.value})} className={i}>
              <option value="">-- เลือก --</option>
              <option value="ประถมศึกษา">ประถมศึกษา</option>
              <option value="มัธยมศึกษา">มัธยมศึกษา</option>
              <option value="ปวช.">ปวช.</option>
              <option value="ปวส.">ปวส.</option>
              <option value="ปริญญาตรี">ปริญญาตรี</option>
              <option value="ปริญญาโท">ปริญญาโท</option>
            </select>
          </div>
        </div>
        <div><label className="text-xs text-muted-foreground">หมายเลขประชาชน</label><input value={form.nationalId||""} onChange={e=>setForm({...form,nationalId:e.target.value})} className={i} maxLength={13} /></div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold">ใบอนุญาตขับขี่</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">ใบขับขี่พลเรือน (เลือกได้หลายข้อ)</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { val: "บ.1", label: "บ.1 รถยนต์ส่วนบุคคล ไม่เกิน 3,500 กก." },
                { val: "บ.2", label: "บ.2 รถยนต์ส่วนบุคคล นั่งเกิน 7 คน" },
                { val: "ท.1", label: "ท.1 รถยนต์สาธารณะ ไม่เกิน 3,500 กก." },
                { val: "ท.2", label: "ท.2 รถยนต์สาธารณะ นั่งไม่เกิน 20 คน" },
                { val: "ท.3", label: "ท.3 รถยนต์สาธารณะ นั่งเกิน 20 คน" },
                { val: "ท.4", label: "ท.4 รถบรรทุกสาธารณะ" },
                { val: "ข.1", label: "ข.1 รถจักรยานยนต์" },
                { val: "ข.2", label: "ข.2 รถจักรยานยนต์สามล้อ" },
                { val: "ข.3", label: "ข.3 รถแทรกเตอร์" },
                { val: "ข.4", label: "ข.4 รถออฟโรด" },
              ].map(opt => {
                const checked = (form.civilianLicense||"").split(",").filter(Boolean).includes(opt.val)
                return (
                  <label key={opt.val} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      const arr = (form.civilianLicense||"").split(",").filter(Boolean)
                      const next = checked ? arr.filter((v: string)=>v!==opt.val) : [...arr, opt.val]
                      setForm({...form, civilianLicense: next.join(",")})
                    }} className="rounded" />
                    {opt.label}
                  </label>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">ใบขับขี่ ทบ. (เลือกได้หลายข้อ)</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { val: "ชนิดที่ 1", label: "ชนิดที่ 1 รถยนต์สายพานใช้คันบังคับ" },
                { val: "ชนิดที่ 2", label: "ชนิดที่ 2 รถยนต์สายพาน/กึ่งสายพาน หรือ 3 ล้อ เกิน 2 ตัน" },
                { val: "ชนิดที่ 3", label: "ชนิดที่ 3 รถยนต์ 3 ล้อ ไม่เกิน 2 ตัน" },
                { val: "ชนิดที่ 4", label: "ชนิดที่ 4 รถจักรยานยนต์พ่วงข้าง" },
              ].map(opt => {
                const checked = (form.armyLicense||"").split(",").filter(Boolean).includes(opt.val)
                return (
                  <label key={opt.val} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      const arr = (form.armyLicense||"").split(",").filter(Boolean)
                      const next = checked ? arr.filter((v: string)=>v!==opt.val) : [...arr, opt.val]
                      setForm({...form, armyLicense: next.join(",")})
                    }} className="rounded" />
                    {opt.label}
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
      </button>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold">เปลี่ยนรหัสผ่าน</h3>
        <div><label className="text-xs text-muted-foreground">รหัสผ่านใหม่</label><input type="password" value={form.newPassword||""} onChange={e=>setForm({...form,newPassword:e.target.value})} className={i} placeholder="อย่างน้อย 4 ตัว" /></div>
        <div><label className="text-xs text-muted-foreground">ยืนยันรหัสผ่าน</label><input type="password" value={form.confirmPassword||""} onChange={e=>setForm({...form,confirmPassword:e.target.value})} className={i} placeholder="กรอกรหัสอีกครั้ง" /></div>
        <button onClick={changePw} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">
          เปลี่ยนรหัสผ่าน
        </button>
      </div>
    </div>
  )
}
