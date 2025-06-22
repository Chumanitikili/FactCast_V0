import { Suspense } from "react"
import LiveFactChecker from "@/components/live-fact-checker"
import { DashboardLoading } from "@/components/dashboard-loading"

export default function LivePage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <LiveFactChecker />
    </Suspense>
  )
}
