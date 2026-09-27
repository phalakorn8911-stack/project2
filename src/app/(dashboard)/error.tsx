"use client"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">เกิดข้อผิดพลาดในการแสดงหน้านี้</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ให้แจ้งผู้ดูแลระบบ"}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        ลองใหม่
      </button>
    </div>
  )
}
