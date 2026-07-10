import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { lintJavaScript } from "@/lib/linters/eslint"
import { lintPython } from "@/lib/linters/python-linter"
import { requestAIReview } from "@/lib/openai"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If Supabase has no active user (running locally without fully configured auth),
    // we use a mock user ID so the app remains testable.
    const userId = user?.id || "00000000-0000-0000-0000-000000000000"

    const { projectName, language, code, fileName, fileUrl } = await request.json()

    if (!projectName || !language || !code) {
      return NextResponse.json(
        { message: "Missing required fields (projectName, language, code)" },
        { status: 400 }
      )
    }

    // 2. Stage 1: Run Static Linter
    let staticFindings: any[] = []
    if (language === "javascript" || language === "typescript") {
      staticFindings = lintJavaScript(code)
    } else if (language === "python") {
      staticFindings = lintPython(code)
    }

    // 3. Stage 2: Run AI Code Review
    const aiReview = await requestAIReview(code, language, fileName || "main.js", staticFindings)

    // 4. Save to Database (with mock fallback if Supabase client fails)
    let projectId = ""
    let reviewId = ""

    try {
      // Find or create project
      const { data: existingProjects, error: fetchProjError } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", userId)
        .eq("project_name", projectName)

      if (fetchProjError) throw fetchProjError

      if (existingProjects && existingProjects.length > 0) {
        projectId = existingProjects[0].id
      } else {
        const { data: newProject, error: createProjError } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            project_name: projectName,
            language,
          })
          .select("id")
          .single()

        if (createProjError) throw createProjError
        projectId = newProject.id
      }

      // Create Review
      const { data: newReview, error: createRevError } = await supabase
        .from("reviews")
        .insert({
          project_id: projectId,
          review_type: "combined",
          overall_score: aiReview.overall_score,
          summary: aiReview.summary,
          code,
          file_name: fileName || "main.js",
        })
        .select("id")
        .single()

      if (createRevError) throw createRevError
      reviewId = newReview.id

      // Create Review Findings
      const findingsToInsert = aiReview.findings.map((f) => ({
        review_id: reviewId,
        severity: f.severity,
        issue: f.issue,
        explanation: f.explanation,
        suggested_fix: f.suggested_fix || null,
        file_name: fileName || "main.js",
        line_number: f.line_number,
      }))

      if (findingsToInsert.length > 0) {
        const { error: insertFindError } = await supabase
          .from("review_findings")
          .insert(findingsToInsert)

        if (insertFindError) throw insertFindError
      }
    } catch (dbError: any) {
      console.warn("Supabase database insert failed, generating in-memory mock review ID", dbError)
      
      // Fallback: generate a random uuid so the user can navigate to the page and see the mock findings
      reviewId = "mock-" + Math.random().toString(36).substr(2, 9)

      // Store in global mock cache if we want to retrieve it, or we can pass findings directly
      // In Next.js, we can use a global variable to persist mock reviews for local testing
      if (globalThis) {
        if (!(globalThis as any).mockReviews) {
          (globalThis as any).mockReviews = {}
        }
        (globalThis as any).mockReviews[reviewId] = {
          id: reviewId,
          projectName,
          language,
          overall_score: aiReview.overall_score,
          summary: aiReview.summary,
          created_at: new Date().toISOString(),
          findings: aiReview.findings.map((f, i) => ({
            id: `mock-finding-${i}`,
            severity: f.severity,
            issue: f.issue,
            explanation: f.explanation,
            suggested_fix: f.suggested_fix,
            file_name: fileName || "main.js",
            line_number: f.line_number,
          })),
        }
      }
    }

    return NextResponse.json({
      success: true,
      reviewId,
      score: aiReview.overall_score,
    })
  } catch (error: any) {
    console.error("API Review Route Error:", error)
    return NextResponse.json(
      { message: error.message || "Failed to process review" },
      { status: 500 }
    )
  }
}
