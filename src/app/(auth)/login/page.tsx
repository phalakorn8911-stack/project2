"use client"

import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { Truck, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setLoading(false)
    } else {
      const res = await fetch("/api/auth/session")
      const session = await res.json()
      const role = session?.user?.role

      if (role === "admin") {
        router.push("/dashboard")
      } else if (role === "mechanic") {
        router.push("/work-orders")
      } else if (role === "driver") {
        router.push("/vehicles")
      } else {
        router.push("/dashboard")
      }
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 30%, #1e3a1e 60%, #162b16 100%)" }}>
      {/* Layer 1: 3D Thai Army Emblem - Shadow depth */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg transform='translate(122,122)'%3E%3Ccircle cx='0' cy='3' r='95' fill='none' stroke='%23000' stroke-width='3' opacity='0.5'/%3E%3Ccircle cx='0' cy='3' r='80' fill='none' stroke='%23000' stroke-width='2' opacity='0.3'/%3E%3Cpath d='M0 3 L0 -105' stroke='%23000' stroke-width='2.5' opacity='0.4'/%3E%3Cpath d='M-45 55 L0 3 L45 55' stroke='%23000' stroke-width='2' opacity='0.35'/%3E%3Cpath d='M-30 70 L0 3 L30 70' stroke='%23000' stroke-width='1.5' opacity='0.3'/%3E%3Cpath d='M0 -105 L-12 -75 L12 -75 Z' fill='none' stroke='%23000' stroke-width='1.5' opacity='0.3'/%3E%3Cpath d='M0 -105 L-8 -80 L8 -80 Z' fill='%23000' opacity='0.15'/%3E%3Cpath d='M-45 55 L-55 30 L-30 20' stroke='%23000' stroke-width='1.5' opacity='0.3'/%3E%3Cpath d='M45 55 L55 30 L30 20' stroke='%23000' stroke-width='1.5' opacity='0.3'/%3E%3Cellipse cx='0' cy='100' rx='60' ry='5' fill='%23000' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "240px 240px", backgroundPosition: "5px 5px" }} />
      {/* Layer 2: 3D Thai Army Emblem - Main face */}
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffffff' stop-opacity='1'/%3E%3Cstop offset='100%25' stop-color='%23ffffff' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform='translate(120,120)' stroke='url(%23g1)' fill='none'%3E%3C!-- outer chakra ring --%3E%3Ccircle cx='0' cy='0' r='95' stroke-width='4'/%3E%3Ccircle cx='0' cy='0' r='88' stroke-width='1.5'/%3E%3Ccircle cx='0' cy='0' r='80' stroke-width='2'/%3E%3Ccircle cx='0' cy='0' r='73' stroke-width='1'/%3E%3C!-- chakra teeth (16 spokes) --%3E%3Cg stroke-width='1.2'%3E%3Cline x1='0' y1='-80' x2='0' y2='-95'/%3E%3Cline x1='29' y1='-75' x2='34' y2='-89'/%3E%3Cline x1='55' y1='-55' x2='65' y2='-65'/%3E%3Cline x1='75' y1='-29' x2='89' y2='-34'/%3E%3Cline x1='80' y1='0' x2='95' y2='0'/%3E%3Cline x1='75' y1='29' x2='89' y2='34'/%3E%3Cline x1='55' y1='55' x2='65' y2='65'/%3E%3Cline x1='29' y1='75' x2='34' y2='89'/%3E%3Cline x1='0' y1='80' x2='0' y2='95'/%3E%3Cline x1='-29' y1='75' x2='-34' y2='89'/%3E%3Cline x1='-55' y1='55' x2='-65' y2='65'/%3E%3Cline x1='-75' y1='29' x2='-89' y2='34'/%3E%3Cline x1='-80' y1='0' x2='-95' y2='0'/%3E%3Cline x1='-75' y1='-29' x2='-89' y2='-34'/%3E%3Cline x1='-55' y1='-55' x2='-65' y2='-65'/%3E%3Cline x1='-29' y1='-75' x2='-34' y2='-89'/%3E%3C/g%3E%3C!-- inner decorative ring --%3E%3Ccircle cx='0' cy='0' r='60' stroke-width='2'/%3E%3Ccircle cx='0' cy='0' r='55' stroke-width='0.8'/%3E%3C!-- trident (ตรี) --%3E%3Cpath d='M0 55 L0 -50' stroke-width='3'/%3E%3Cpath d='M0 -50 L0 -85' stroke-width='2.5'/%3E%3Cpath d='M0 -85 L-5 -100 Q0 -110 5 -100 L0 -85' stroke-width='1.5'/%3E%3Cpath d='M0 -50 L-25 -30 Q-30 -25 -20 -20 L0 -50' stroke-width='2'/%3E%3Cpath d='M0 -50 L25 -30 Q30 -25 20 -20 L0 -50' stroke-width='2'/%3E%3Cpath d='M-25 -30 L-30 -45 Q-25 -55 -20 -45 L-25 -30' stroke-width='1.2'/%3E%3Cpath d='M25 -30 L30 -45 Q25 -55 20 -45 L25 -30' stroke-width='1.2'/%3E%3C!-- trident side prongs --%3E%3Cpath d='M0 55 L-35 25 Q-40 20 -35 15' stroke-width='1.5'/%3E%3Cpath d='M0 55 L35 25 Q40 20 35 15' stroke-width='1.5'/%3E%3Cpath d='M-35 25 L-42 15 Q-45 10 -38 8' stroke-width='1'/%3E%3Cpath d='M35 25 L42 15 Q45 10 38 8' stroke-width='1'/%3E%3C!-- center jewel --%3E%3Ccircle cx='0' cy='-50' r='6' stroke-width='1.5'/%3E%3Ccircle cx='0' cy='-50' r='3' stroke-width='1'/%3E%3C!-- crown top --%3E%3Cpath d='M-15 -85 L-10 -95 L0 -105 L10 -95 L15 -85' stroke-width='1.5'/%3E%3Cpath d='M-8 -95 L0 -100 L8 -95' stroke-width='1'/%3E%3C!-- laurel wreath left --%3E%3Cpath d='M-65 50 Q-80 20 -70 -15 Q-65 -35 -50 -50' stroke-width='1'/%3E%3Cpath d='M-62 45 Q-70 30 -65 10' stroke-width='0.6'/%3E%3Cpath d='M-68 35 Q-75 20 -70 0' stroke-width='0.6'/%3E%3Cpath d='M-70 20 Q-78 5 -72 -10' stroke-width='0.6'/%3E%3Cpath d='M-68 5 Q-74 -10 -68 -25' stroke-width='0.6'/%3E%3C!-- laurel wreath right --%3E%3Cpath d='M65 50 Q80 20 70 -15 Q65 -35 50 -50' stroke-width='1'/%3E%3Cpath d='M62 45 Q70 30 65 10' stroke-width='0.6'/%3E%3Cpath d='M68 35 Q75 20 70 0' stroke-width='0.6'/%3E%3Cpath d='M70 20 Q78 5 72 -10' stroke-width='0.6'/%3E%3Cpath d='M68 5 Q74 -10 68 -25' stroke-width='0.6'/%3E%3C!-- bottom ribbon --%3E%3Cpath d='M-30 65 Q-20 75 0 78 Q20 75 30 65' stroke-width='1.2'/%3E%3Cpath d='M-25 70 Q-15 78 0 80 Q15 78 25 70' stroke-width='0.8'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "240px 240px" }} />
      {/* Layer 3: 3D Thai Army Emblem - Highlight edge */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffffff' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23ffffff' stop-opacity='0.2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform='translate(120,120)' stroke='url(%23g2)' fill='none'%3E%3Ccircle cx='0' cy='0' r='96' stroke-width='0.8'/%3E%3Ccircle cx='0' cy='0' r='81' stroke-width='0.6'/%3E%3Ccircle cx='0' cy='0' r='61' stroke-width='0.5'/%3E%3Cpath d='M0 55 L0 -85' stroke-width='1'/%3E%3Cpath d='M0 -85 L-3 -98 Q0 -106 3 -98 L0 -85' stroke-width='0.8'/%3E%3Cpath d='M0 -50 L-22 -32 L0 -50 L22 -32' stroke-width='0.8'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "240px 240px", backgroundPosition: "-2px -2px" }} />
      {/* Layer 4: Military truck watermark */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='350' height='220' viewBox='0 0 350 220'%3E%3Cdefs%3E%3Cstyle%3E.t%7Bfill:none;stroke:%23fff;stroke-width:0.8;stroke-linecap:round;stroke-linejoin:round%7D%3C/style%3E%3C/defs%3E%3Cg class='t'%3E%3Cline x1='15' y1='130' x2='335' y2='130' stroke-width='1.5'/%3E%3Cline x1='15' y1='134' x2='335' y2='134' stroke-width='1'/%3E%3Crect x='10' y='115' width='10' height='20' rx='2'/%3E%3Crect x='35' y='82' width='65' height='48' rx='2'/%3E%3Cpath d='M40 82 Q40 70 48 70 L88 70 Q95 70 95 82'/%3E%3Crect x='48' y='86' width='16' height='12' rx='1'/%3E%3Crect x='70' y='86' width='16' height='12' rx='1'/%3E%3Cline x1='65' y1='82' x2='65' y2='130' stroke-width='0.5'/%3E%3Crect x='18' y='110' width='7' height='5' rx='2'/%3E%3Crect x='100' y='88' width='125' height='42' rx='1'/%3E%3Cline x1='100' y1='100' x2='225' y2='100' stroke-width='0.4'/%3E%3Cline x1='100' y1='110' x2='225' y2='110' stroke-width='0.4'/%3E%3Cline x1='100' y1='120' x2='225' y2='120' stroke-width='0.4'/%3E%3Cline x1='125' y1='88' x2='125' y2='130' stroke-width='0.3'/%3E%3Cline x1='150' y1='88' x2='150' y2='130' stroke-width='0.3'/%3E%3Cline x1='175' y1='88' x2='175' y2='130' stroke-width='0.3'/%3E%3Cline x1='200' y1='88' x2='200' y2='130' stroke-width='0.3'/%3E%3Cpath d='M105 88 Q105 76 115 76 L120 76 Q125 76 125 88' stroke-width='0.6'/%3E%3Cpath d='M160 88 Q160 76 170 76 L175 76 Q180 76 180 88' stroke-width='0.6'/%3E%3Cpath d='M105 78 Q160 68 225 78' stroke-width='0.4'/%3E%3Crect x='225' y='115' width='7' height='20' rx='1'/%3E%3Ccircle cx='55' cy='140' r='12' stroke-width='1'/%3E%3Ccircle cx='55' cy='140' r='7' stroke-width='0.5'/%3E%3Ccircle cx='55' cy='140' r='3' stroke-width='0.7'/%3E%3Ccircle cx='185' cy='140' r='12' stroke-width='1'/%3E%3Ccircle cx='185' cy='140' r='7' stroke-width='0.5'/%3E%3Ccircle cx='185' cy='140' r='3' stroke-width='0.7'/%3E%3Ccircle cx='215' cy='140' r='12' stroke-width='1'/%3E%3Ccircle cx='215' cy='140' r='7' stroke-width='0.5'/%3E%3Ccircle cx='215' cy='140' r='3' stroke-width='0.7'/%3E%3Cpath d='M38 130 Q38 122 47 120 Q55 118 63 120 Q72 122 72 130' stroke-width='0.6'/%3E%3Cpath d='M168 130 Q168 122 177 120 Q185 118 193 120 Q202 122 202 130' stroke-width='0.6'/%3E%3Cpath d='M202 130 Q202 122 210 120 Q218 118 225 120 Q233 122 233 130' stroke-width='0.6'/%3E%3Cellipse cx='140' cy='150' rx='110' ry='3' stroke='none' fill='%23fff' opacity='0.12'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "350px 220px" }} />
      {/* Layer 4b: Unit text watermark ร.153 พัน.3 */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='120' viewBox='0 0 300 120'%3E%3Ctext x='150' y='60' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-weight='bold' font-size='28' fill='%23fff' letter-spacing='6'%3E%E0%B8%A3.153 %E0%B8%9E%E0%B8%B1%E0%B8%99.3%3C/text%3E%3Cline x1='20' y1='85' x2='280' y2='85' stroke='%23fff' stroke-width='0.5'/%3E%3Cline x1='40' y1='90' x2='260' y2='90' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "300px 120px" }} />
      {/* Layer 5: Stars decoration */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cpath d='M90 15l5 10 11 1.5-8 7.8 1.8 11-9.8-5.2-9.8 5.2 1.8-11-8-7.8 11-1.5z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "180px 180px" }} />
      {/* Layer 6: Subtle dot texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle, %23ffffff 0.8px, transparent 0.8px)`, backgroundSize: "20px 20px" }} />
      <div className="w-full max-w-sm bg-card/95 backdrop-blur-sm rounded-2xl border border-border shadow-2xl p-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">สถานภาพยานยนต์ ร.153 พัน.3</h1>
          <p className="text-sm text-muted-foreground mt-1">Vehicle Maintenance Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">อีเมล</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@army.mail"
              required
              className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">รหัสผ่าน</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1234"
                required
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

      </div>
    </div>
  )
}
