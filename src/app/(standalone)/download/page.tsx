"use client"

import { useState } from "react"
import { Download, Smartphone, QrCode, Copy, Check, ExternalLink } from "lucide-react"

export default function DownloadPage() {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== "undefined" ? window.location.origin : ""

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <Smartphone className="size-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">สถานภาพยานยนต์ ร.153 พัน.3</h1>
          <p className="text-slate-400">ดาวน์โหลดแอปลงมือถือของคุณ</p>
        </div>

        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">ลิงค์ดาวน์โหลด</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2 text-sm text-slate-300 truncate">{url}</div>
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-yellow-400 transition-colors">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="size-4 text-yellow-500" />
              วิธีติดตั้งบน Android
            </h2>
            <ol className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">1</span>
                <span>เปิดเว็บด้วย <strong className="text-slate-300">Chrome</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">2</span>
                <span>ล็อกอินเข้าระบบ</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">3</span>
                <span>กดปุ่ม <strong className="text-slate-300">⋮</strong> มุมขวาบน</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">4</span>
                <span>เลือก <strong className="text-slate-300">เพิ่มลงหน้าจอหลัก</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">5</span>
                <span>กด <strong className="text-slate-300">เพิ่ม</strong></span>
              </li>
            </ol>
          </div>

          <div className="border-t border-slate-700/50 pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="size-4 text-yellow-500" />
              วิธีติดตั้งบน iPhone
            </h2>
            <ol className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">1</span>
                <span>เปิดเว็บด้วย <strong className="text-slate-300">Safari</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">2</span>
                <span>ล็อกอินเข้าระบบ</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">3</span>
                <span>กดปุ่ม <strong className="text-slate-300">แชร์</strong> (□↑) ด้านล่าง</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">4</span>
                <span>เลือก <strong className="text-slate-300">เพิ่มลงหน้าจอหลัก</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">5</span>
                <span>กด <strong className="text-slate-300">เพิ่ม</strong></span>
              </li>
            </ol>
          </div>
        </div>

        <div className="text-center">
          <a href="/login" className="inline-flex items-center gap-2 text-sm text-yellow-500 hover:text-yellow-400 transition-colors">
            <ExternalLink className="size-4" />
            เข้าสู่ระบบ
          </a>
        </div>

        <p className="text-center text-xs text-slate-600">กองพันทหารราบที่ 153 กรมทหารราบที่ 15</p>
      </div>
    </div>
  )
}
