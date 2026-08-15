"use client"

import { useState } from "react"
import { Bot, Send, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "ai"; content: string }

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "สวัสดีครับ ผมเป็นผู้ช่วย AI สำหรับระบบบริหารยานพาหนะ สามารถสอบถามข้อมูลเกี่ยวกับสถานะรถ งานซ่อม หรืออะไหล่ได้เลยครับ" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "ai", content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">ผู้ช่วย AI</h2>
        <p className="text-sm text-muted-foreground">ถาม-ตอบเกี่ยวกับระบบยานพาหนะ (ข้อมูลจากฐานข้อมูลจริง)</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
            {msg.role === "ai" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                <Bot className="size-4" />
              </div>
            )}
            <div className={cn(
              "max-w-[70%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "ai"
                ? "bg-muted text-card-foreground"
                : "bg-primary text-primary-foreground",
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
              <Bot className="size-4" />
            </div>
            <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Sparkles className="size-3.5 animate-pulse inline mr-1.5" />
              กำลังคิด...
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="พิมพ์คำถาม... เช่น รถกี่คัน, งานซ่อมค้าง, อะไหล่ใกล้หมด"
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  )
}
