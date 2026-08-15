import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { ReadinessSection } from "@/components/dashboard/readiness-section"
import { DataTables } from "@/components/dashboard/data-tables"
import { AiSummary } from "@/components/dashboard/ai-summary"

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">ภาพรวมระบบ</h2>
        <p className="text-sm text-muted-foreground">ข้อมูลสถานะยานพาหนะและงานซ่อมบำรุงทั้งหมด</p>
      </div>

      <SummaryCards />
      <ChartsSection />
      <ReadinessSection />
      <DataTables />
      <AiSummary />
    </div>
  )
}
