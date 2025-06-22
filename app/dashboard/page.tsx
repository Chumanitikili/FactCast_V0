import { Suspense } from "react"
import ComprehensiveDashboard from "@/components/comprehensive-dashboard"
import { DashboardLoading } from "@/components/dashboard-loading"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ComprehensiveDashboard />
    </Suspense>
  )
}
