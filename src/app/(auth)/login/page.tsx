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
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='280' viewBox='0 0 320 280'%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill:none;stroke:%23ffffff;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round%7D%3C/style%3E%3C/defs%3E%3Cg class='a'%3E%3Cpath d='M40 180v-30h15l10-15h60l10 15h15v30'/%3E%3Cpath d='M35 180h110'/%3E%3Ccircle cx='55' cy='190' r='10'/%3E%3Ccircle cx='55' cy='190' r='5'/%3E%3Ccircle cx='100' cy='190' r='10'/%3E%3Ccircle cx='100' cy='190' r='5'/%3E%3Ccircle cx='130' cy='190' r='10'/%3E%3Ccircle cx='130' cy='190' r='5'/%3E%3Crect x='65' y='135' width='55' height='25' rx='2'/%3E%3Cline x1='80' y1='135' x2='80' y2='120'/%3E%3Cline x1='105' y1='135' x2='105' y2='120'/%3E%3Crect x='78' y='118' width='30' height='4' rx='1'/%3E%3Cpath d='M45 155l-5 0-2-10h10l-3 10'/%3E%3Cpath d='M135 155l5 0 2-10h-10l3 10'/%3E%3Cpath d='M55 195v8'/%3E%3Cpath d='M100 195v8'/%3E%3Cpath d='M130 195v8'/%3E%3C/g%3E%3Cg class='a' transform='translate(180,40)'%3E%3Cpath d='M40 180v-30h15l10-15h60l10 15h15v30'/%3E%3Cpath d='M35 180h110'/%3E%3Ccircle cx='55' cy='190' r='10'/%3E%3Ccircle cx='55' cy='190' r='5'/%3E%3Ccircle cx='100' cy='190' r='10'/%3E%3Ccircle cx='100' cy='190' r='5'/%3E%3Ccircle cx='130' cy='190' r='10'/%3E%3Ccircle cx='130' cy='190' r='5'/%3E%3Crect x='65' y='135' width='55' height='25' rx='2'/%3E%3Cline x1='80' y1='135' x2='80' y2='120'/%3E%3Cline x1='105' y1='135' x2='105' y2='120'/%3E%3Crect x='78' y='118' width='30' height='4' rx='1'/%3E%3Cpath d='M45 155l-5 0-2-10h10l-3 10'/%3E%3Cpath d='M135 155l5 0 2-10h-10l3 10'/%3E%3Cpath d='M55 195v8'/%3E%3Cpath d='M100 195v8'/%3E%3Cpath d='M130 195v8'/%3E%3C/g%3E%3Cpath d='M150 30l4 8 9 1-6 6 2 9-9-5-9 5 2-9-6-6 9-1z' fill='none' stroke='%23ffffff' stroke-width='0.8' opacity='0.4'/%3E%3Cpath d='M30 250l4 8 9 1-6 6 2 9-9-5-9 5 2-9-6-6 9-1z' fill='none' stroke='%23ffffff' stroke-width='0.8' opacity='0.4'/%3E%3Cpath d='M290 130l4 8 9 1-6 6 2 9-9-5-9 5 2-9-6-6 9-1z' fill='none' stroke='%23ffffff' stroke-width='0.8' opacity='0.4'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "320px 280px" }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='%23ffffff' stroke-width='0.3'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "100px 100px" }} />
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
