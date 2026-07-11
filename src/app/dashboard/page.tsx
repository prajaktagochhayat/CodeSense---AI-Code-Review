import { createClient } from "@/lib/supabase/server"
import { DashboardOverview, ReviewItem } from "@/components/dashboard-overview"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let reviewsList: ReviewItem[] = []

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || "00000000-0000-0000-0000-000000000000"

    // Fetch from Supabase joined tables
    const { data: dbReviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        overall_score,
        summary,
        created_at,
        file_name,
        projects!inner (
          project_name,
          language,
          user_id
        ),
        review_findings (
          severity
        )
      `)
      .eq("projects.user_id", userId)
      .order("created_at", { ascending: false })

    if (!error && dbReviews) {
      reviewsList = dbReviews.map((r: any) => {
        const findings = r.review_findings || []
        const proj = Array.isArray(r.projects) ? r.projects[0] : r.projects
        return {
          id: r.id,
          overall_score: r.overall_score || 100,
          summary: r.summary || "No summary available.",
          created_at: r.created_at,
          file_name: r.file_name || "main.js",
          project_name: proj?.project_name || "Unnamed Project",
          language: proj?.language || "javascript",
          findings_summary: {
            critical: findings.filter((f: any) => f.severity === "critical").length,
            warning: findings.filter((f: any) => f.severity === "warning").length,
            minor: findings.filter((f: any) => f.severity === "minor").length,
            info: findings.filter((f: any) => f.severity === "info").length,
          },
        }
      })
    }
  } catch (error) {
    console.warn("Could not load reviews from Supabase, relying on in-memory / sample fallbacks", error)
  }

  // Inject in-memory mock reviews if any exist in globalThis
  const mockCache = (globalThis as any).mockReviews || {}
  const mockReviews = Object.values(mockCache).map((r: any) => ({
    id: r.id,
    overall_score: r.overall_score,
    summary: r.summary,
    created_at: r.created_at,
    file_name: r.file_name,
    project_name: r.projectName,
    language: r.language,
    findings_summary: {
      critical: r.findings.filter((f: any) => f.severity === "critical").length,
      warning: r.findings.filter((f: any) => f.warning === "warning" || f.severity === "warning").length,
      minor: r.findings.filter((f: any) => f.severity === "minor").length,
      info: r.findings.filter((f: any) => f.severity === "info").length,
    },
  }))

  reviewsList = [...mockReviews, ...reviewsList]



  return <DashboardOverview initialReviews={reviewsList} />
}
