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
    <div className="flex min-h-dvh items-center justify-center p-4" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%233a4a3a' stroke-width='0.5' opacity='0.06'%3E%3Cpath d='M30 140 L30 125 L40 120 L55 120 L60 115 L70 115 L75 120 L90 120 L95 125 L95 140'/%3E%3Ccircle cx='40' cy='145' r='5'/%3E%3Ccircle cx='55' cy='145' r='5'/%3E%3Ccircle cx='80' cy='145' r='5'/%3E%3Ccircle cx='90' cy='145' r='5'/%3E%3Crect x='60' y='115' width='10' height='5' rx='1'/%3E%3Cpath d='M140 135 L140 125 L145 120 L175 120 L180 125 L180 135'/%3E%3Ccircle cx='148' cy='140' r='4'/%3E%3Ccircle cx='160' cy='140' r='4'/%3E%3Ccircle cx='172' cy='140' r='4'/%3E%3Cline x1='160' y1='125' x2='160' y2='105'/%3E%3Ccircle cx='160' cy='103' r='3'/%3E%3Cpath d='M30 60 L30 50 L40 45 L60 45 L65 50 L65 60'/%3E%3Ccircle cx='38' cy='64' r='4'/%3E%3Ccircle cx='55' cy='64' r='4'/%3E%3Cpath d='M140 55 L140 45 L145 40 L165 40 L170 45 L170 55'/%3E%3Ccircle cx='148' cy='60' r='4'/%3E%3Ccircle cx='162' cy='60' r='4'/%3E%3Cline x1='140' y1='48' x2='170' y2='48'/%3E%3Cpath d='M100 80 L102 86 L108 86 L103 90 L105 96 L100 92 L95 96 L97 90 L92 86 L98 86 Z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "200px 200px" }}>
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg p-8">
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
