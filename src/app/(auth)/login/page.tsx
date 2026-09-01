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
      {/* Layer 1: Real Army Emblem - Shadow depth */}
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "url('/army-emblem.jpg')", backgroundRepeat: "repeat", backgroundSize: "220px 220px", backgroundPosition: "4px 4px", filter: "grayscale(1) brightness(1.8) contrast(0.6) blur(1px)" }} />
      {/* Layer 2: Real Army Emblem - Main face */}
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "url('/army-emblem.jpg')", backgroundRepeat: "repeat", backgroundSize: "220px 220px", filter: "grayscale(1) brightness(2.5) contrast(0.5)" }} />
      {/* Layer 3: Real Army Emblem - Highlight edge */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url('/army-emblem.jpg')", backgroundRepeat: "repeat", backgroundSize: "220px 220px", backgroundPosition: "-2px -2px", filter: "grayscale(1) brightness(3) contrast(0.3)" }} />
      {/* Layer 4: Unit text ร.153 พัน.3 */}
      <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='100' viewBox='0 0 280 100'%3E%3Ctext x='140' y='45' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-weight='bold' font-size='26' fill='%23fff' letter-spacing='4'%3E%E0%B8%A3.153 %E0%B8%9E%E0%B8%B1%E0%B8%99.3%3C/text%3E%3Cline x1='15' y1='65' x2='265' y2='65' stroke='%23fff' stroke-width='0.5'/%3E%3Cline x1='30' y1='69' x2='250' y2='69' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "280px 100px", backgroundPosition: "10px 5px" }} />
      {/* Layer 5: Stars */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M80 12l4 8 9 1.2-7 6.8 1.6 9-7.6-4-7.6 4 1.6-9-7-6.8 9-1.2z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "160px 160px" }} />
      {/* Layer 6: Dot texture */}
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: `radial-gradient(circle, %23ffffff 0.7px, transparent 0.7px)`, backgroundSize: "18px 18px" }} />
      <div className="w-full max-w-sm bg-card/95 backdrop-blur-sm rounded-2xl border border-border shadow-2xl p-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">สถานภาพยานยนต์ ร.153 พัน.3</h1>
          <p className="text-sm text-muted-foreground mt-1">ระบบจัดการซ่อมบำรุงยานยนต์</p>
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
