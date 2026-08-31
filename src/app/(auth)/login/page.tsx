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
      {/* Layer 1: Military truck watermark - large detailed */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Cdefs%3E%3Cstyle%3E.t%7Bfill:none;stroke:%23fff;stroke-width:1;stroke-linecap:round;stroke-linejoin:round%7D%3C/style%3E%3C/defs%3E%3Cg class='t'%3E%3C!-- chassis --%3E%3Cline x1='20' y1='155' x2='380' y2='155' stroke-width='2'/%3E%3Cline x1='20' y1='160' x2='380' y2='160' stroke-width='1.5'/%3E%3C!-- front bumper --%3E%3Crect x='15' y='140' width='12' height='22' rx='2' stroke-width='1'/%3E%3C!-- front fender --%3E%3Cpath d='M27 155 Q27 135 45 135 L55 135' stroke-width='1'/%3E%3C!-- cab body --%3E%3Crect x='40' y='100' width='75' height='55' rx='3' stroke-width='1.2'/%3E%3C!-- cab roof --%3E%3Cpath d='M45 100 Q45 85 55 85 L100 85 Q110 85 110 100' stroke-width='1.2'/%3E%3C!-- windshield --%3E%3Cpath d='M52 100 L52 90 Q52 88 54 88 L70 88 L70 100' stroke-width='0.8'/%3E%3Cpath d='M80 100 L80 88 L98 88 Q102 88 102 92 L102 100' stroke-width='0.8'/%3E%3C!-- side window --%3E%3Crect x='55' y='105' width='18' height='14' rx='1' stroke-width='0.8'/%3E%3Crect x='80' y='105' width='18' height='14' rx='1' stroke-width='0.8'/%3E%3C!-- door line --%3E%3Cline x1='75' y1='100' x2='75' y2='155' stroke-width='0.6'/%3E%3C!-- door handle --%3E%3Cline x1='78' y1='125' x2='84' y2='125' stroke-width='1.5'/%3E%3C!-- headlight --%3E%3Crect x='22' y='130' width='8' height='6' rx='2' stroke-width='0.8'/%3E%3Ccircle cx='26' cy='133' r='2' stroke-width='0.6'/%3E%3C!-- side mirror --%3E%3Crect x='32' y='95' width='8' height='12' rx='1' stroke-width='0.7'/%3E%3Cline x1='40' y1='101' x2='43' y2='101' stroke-width='0.7'/%3E%3C!-- exhaust pipe --%3E%3Cpath d='M115 145 L120 145 L120 130 L118 125' stroke-width='1'/%3E%3C!-- cargo bed --%3E%3Crect x='115' y='105' width='145' height='50' rx='1' stroke-width='1.2'/%3E%3C!-- cargo bed sides (slats) --%3E%3Cline x1='115' y1='118' x2='260' y2='118' stroke-width='0.5'/%3E%3Cline x1='115' y1='130' x2='260' y2='130' stroke-width='0.5'/%3E%3Cline x1='115' y1='142' x2='260' y2='142' stroke-width='0.5'/%3E%3C!-- vertical slat lines --%3E%3Cline x1='140' y1='105' x2='140' y2='155' stroke-width='0.4'/%3E%3Cline x1='165' y1='105' x2='165' y2='155' stroke-width='0.4'/%3E%3Cline x1='190' y1='105' x2='190' y2='155' stroke-width='0.4'/%3E%3Cline x1='215' y1='105' x2='215' y2='155' stroke-width='0.4'/%3E%3Cline x1='240' y1='105' x2='240' y2='155' stroke-width='0.4'/%3E%3C!-- canvas frame arches --%3E%3Cpath d='M120 105 Q120 88 135 88 L140 88 Q145 88 145 105' stroke-width='0.7'/%3E%3Cpath d='M185 105 Q185 88 200 88 L205 88 Q210 88 210 105' stroke-width='0.7'/%3E%3Cpath d='M250 105 Q250 88 255 88 L258 88 Q260 88 260 105' stroke-width='0.7'/%3E%3C!-- canvas cover lines --%3E%3Cpath d='M120 92 Q185 80 260 92' stroke-width='0.5'/%3E%3C!-- rear --%3E%3Crect x='260' y='140' width='8' height='22' rx='1' stroke-width='0.8'/%3E%3C!-- rear bumper --%3E%3Cline x1='260' y1='158' x2='270' y2='158' stroke-width='2'/%3E%3C!-- fuel tank --%3E%3Crect x='155' y='162' width='30' height='12' rx='3' stroke-width='0.7'/%3E%3C!-- battery box --%3E%3Crect x='130' y='162' width='18' height='10' rx='1' stroke-width='0.6'/%3E%3C!-- spare tire carrier --%3E%3Ccircle cx='275' cy='130' r='12' stroke-width='0.6'/%3E%3Ccircle cx='275' cy='130' r='6' stroke-width='0.4'/%3E%3Cline x1='275' y1='118' x2='275' y2='108' stroke-width='0.6'/%3E%3Cline x1='275' y1='108' x2='260' y2='108' stroke-width='0.6'/%3E%3C!-- wheels axle 1 (front) --%3E%3Ccircle cx='65' cy='165' r='14' stroke-width='1.2'/%3E%3Ccircle cx='65' cy='165' r='9' stroke-width='0.6'/%3E%3Ccircle cx='65' cy='165' r='4' stroke-width='0.8'/%3E%3C!-- hub bolts --%3E%3Ccircle cx='65' cy='158' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='65' cy='172' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='58' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='72' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3C!-- wheel arch 1 --%3E%3Cpath d='M45 155 Q45 145 55 142 Q65 140 75 142 Q85 145 85 155' stroke-width='0.8'/%3E%3C!-- wheels axle 2 (rear dual) --%3E%3Ccircle cx='210' cy='165' r='14' stroke-width='1.2'/%3E%3Ccircle cx='210' cy='165' r='9' stroke-width='0.6'/%3E%3Ccircle cx='210' cy='165' r='4' stroke-width='0.8'/%3E%3Ccircle cx='210' cy='158' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='210' cy='172' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='203' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='217' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3C!-- wheel arch 2 --%3E%3Cpath d='M190 155 Q190 145 200 142 Q210 140 220 142 Q230 145 230 155' stroke-width='0.8'/%3E%3C!-- wheels axle 3 (rear dual) --%3E%3Ccircle cx='240' cy='165' r='14' stroke-width='1.2'/%3E%3Ccircle cx='240' cy='165' r='9' stroke-width='0.6'/%3E%3Ccircle cx='240' cy='165' r='4' stroke-width='0.8'/%3E%3Ccircle cx='240' cy='158' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='240' cy='172' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='233' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='247' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3C!-- wheel arch 3 --%3E%3Cpath d='M220 155 Q220 145 230 142 Q240 140 250 142 Q260 145 260 155' stroke-width='0.8'/%3E%3C!-- ground shadow --%3E%3Cellipse cx='160' cy='182' rx='130' ry='4' stroke='none' fill='%23fff' opacity='0.15'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "400px 260px" }} />
      {/* Layer 2: Second truck offset + rotated for depth */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'%3E%3Cdefs%3E%3Cstyle%3E.t%7Bfill:none;stroke:%23fff;stroke-width:1;stroke-linecap:round;stroke-linejoin:round%7D%3C/style%3E%3C/defs%3E%3Cg class='t'%3E%3Cline x1='20' y1='155' x2='380' y2='155' stroke-width='2'/%3E%3Cline x1='20' y1='160' x2='380' y2='160' stroke-width='1.5'/%3E%3Crect x='15' y='140' width='12' height='22' rx='2' stroke-width='1'/%3E%3Cpath d='M27 155 Q27 135 45 135 L55 135' stroke-width='1'/%3E%3Crect x='40' y='100' width='75' height='55' rx='3' stroke-width='1.2'/%3E%3Cpath d='M45 100 Q45 85 55 85 L100 85 Q110 85 110 100' stroke-width='1.2'/%3E%3Cpath d='M52 100 L52 90 Q52 88 54 88 L70 88 L70 100' stroke-width='0.8'/%3E%3Cpath d='M80 100 L80 88 L98 88 Q102 88 102 92 L102 100' stroke-width='0.8'/%3E%3Crect x='55' y='105' width='18' height='14' rx='1' stroke-width='0.8'/%3E%3Crect x='80' y='105' width='18' height='14' rx='1' stroke-width='0.8'/%3E%3Cline x1='75' y1='100' x2='75' y2='155' stroke-width='0.6'/%3E%3Cline x1='78' y1='125' x2='84' y2='125' stroke-width='1.5'/%3E%3Crect x='22' y='130' width='8' height='6' rx='2' stroke-width='0.8'/%3E%3Ccircle cx='26' cy='133' r='2' stroke-width='0.6'/%3E%3Crect x='32' y='95' width='8' height='12' rx='1' stroke-width='0.7'/%3E%3Cline x1='40' y1='101' x2='43' y2='101' stroke-width='0.7'/%3E%3Cpath d='M115 145 L120 145 L120 130 L118 125' stroke-width='1'/%3E%3Crect x='115' y='105' width='145' height='50' rx='1' stroke-width='1.2'/%3E%3Cline x1='115' y1='118' x2='260' y2='118' stroke-width='0.5'/%3E%3Cline x1='115' y1='130' x2='260' y2='130' stroke-width='0.5'/%3E%3Cline x1='115' y1='142' x2='260' y2='142' stroke-width='0.5'/%3E%3Cline x1='140' y1='105' x2='140' y2='155' stroke-width='0.4'/%3E%3Cline x1='165' y1='105' x2='165' y2='155' stroke-width='0.4'/%3E%3Cline x1='190' y1='105' x2='190' y2='155' stroke-width='0.4'/%3E%3Cline x1='215' y1='105' x2='215' y2='155' stroke-width='0.4'/%3E%3Cline x1='240' y1='105' x2='240' y2='155' stroke-width='0.4'/%3E%3Cpath d='M120 105 Q120 88 135 88 L140 88 Q145 88 145 105' stroke-width='0.7'/%3E%3Cpath d='M185 105 Q185 88 200 88 L205 88 Q210 88 210 105' stroke-width='0.7'/%3E%3Cpath d='M250 105 Q250 88 255 88 L258 88 Q260 88 260 105' stroke-width='0.7'/%3E%3Cpath d='M120 92 Q185 80 260 92' stroke-width='0.5'/%3E%3Crect x='260' y='140' width='8' height='22' rx='1' stroke-width='0.8'/%3E%3Cline x1='260' y1='158' x2='270' y2='158' stroke-width='2'/%3E%3Crect x='155' y='162' width='30' height='12' rx='3' stroke-width='0.7'/%3E%3Crect x='130' y='162' width='18' height='10' rx='1' stroke-width='0.6'/%3E%3Ccircle cx='275' cy='130' r='12' stroke-width='0.6'/%3E%3Ccircle cx='275' cy='130' r='6' stroke-width='0.4'/%3E%3Cline x1='275' y1='118' x2='275' y2='108' stroke-width='0.6'/%3E%3Cline x1='275' y1='108' x2='260' y2='108' stroke-width='0.6'/%3E%3Ccircle cx='65' cy='165' r='14' stroke-width='1.2'/%3E%3Ccircle cx='65' cy='165' r='9' stroke-width='0.6'/%3E%3Ccircle cx='65' cy='165' r='4' stroke-width='0.8'/%3E%3Ccircle cx='65' cy='158' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='65' cy='172' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='58' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='72' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Cpath d='M45 155 Q45 145 55 142 Q65 140 75 142 Q85 145 85 155' stroke-width='0.8'/%3E%3Ccircle cx='210' cy='165' r='14' stroke-width='1.2'/%3E%3Ccircle cx='210' cy='165' r='9' stroke-width='0.6'/%3E%3Ccircle cx='210' cy='165' r='4' stroke-width='0.8'/%3E%3Ccircle cx='210' cy='158' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='210' cy='172' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='203' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='217' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Cpath d='M190 155 Q190 145 200 142 Q210 140 220 142 Q230 145 230 155' stroke-width='0.8'/%3E%3Ccircle cx='240' cy='165' r='14' stroke-width='1.2'/%3E%3Ccircle cx='240' cy='165' r='9' stroke-width='0.6'/%3E%3Ccircle cx='240' cy='165' r='4' stroke-width='0.8'/%3E%3Ccircle cx='240' cy='158' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='240' cy='172' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='233' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Ccircle cx='247' cy='165' r='1' fill='%23fff' opacity='0.3'/%3E%3Cpath d='M220 155 Q220 145 230 142 Q240 140 250 142 Q260 145 260 155' stroke-width='0.8'/%3E%3Cellipse cx='160' cy='182' rx='130' ry='4' stroke='none' fill='%23fff' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "400px 260px", backgroundPosition: "200px 130px" }} />
      {/* Layer 3: Stars decoration */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M100 20l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z' fill='none' stroke='%23fff' stroke-width='0.6'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />
      {/* Layer 4: Subtle dot pattern for texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, %23ffffff 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
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
