import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReviewDetail, ReviewDetailData } from "@/components/review-detail"
import { MockReviewLoader } from "@/components/mock-review-loader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { id } = await params

  // Resolve mock reviews locally on the client to avoid serverless memory gaps
  if (id.startsWith("mock-")) {
    return <MockReviewLoader id={id} />
  }

  let reviewData: ReviewDetailData | null = null

  // 1. Try to fetch from Supabase
  try {
    const supabase = await createClient()
    const { data: dbReview, error } = await supabase
      .from("reviews")
      .select(`
        id,
        overall_score,
        summary,
        code,
        file_name,
        created_at,
        projects (
          project_name,
          language
        ),
        review_findings (
          id,
          severity,
          issue,
          explanation,
          suggested_fix,
          line_number,
          file_name
        )
      `)
      .eq("id", id)
      .single()

    if (!error && dbReview) {
      const proj = Array.isArray(dbReview.projects) ? dbReview.projects[0] : dbReview.projects
      reviewData = {
        id: dbReview.id,
        project_name: proj?.project_name || "Unnamed Project",
        language: proj?.language || "javascript",
        overall_score: dbReview.overall_score || 100,
        summary: dbReview.summary || "No summary available.",
        code: dbReview.code,
        file_name: dbReview.file_name || "main.js",
        created_at: dbReview.created_at,
        findings: (dbReview.review_findings || []).map((f: any) => ({
          id: f.id,
          severity: f.severity,
          issue: f.issue,
          explanation: f.explanation,
          suggested_fix: f.suggested_fix,
          line_number: f.line_number,
          file_name: f.file_name || "main.js",
        })),
      }
    }
  } catch (error) {
    console.warn("Supabase fetch failed on detail page, checking mock/sample fallbacks", error)
  }

  // 2. Try to fetch from in-memory mock cache
  if (!reviewData) {
    const mockCache = (globalThis as any).mockReviews || {}
    const mockData = mockCache[id]
    if (mockData) {
      reviewData = {
        id: mockData.id,
        project_name: mockData.projectName,
        language: mockData.language,
        overall_score: mockData.overall_score,
        summary: mockData.summary,
        code: mockData.code,
        file_name: mockData.file_name,
        created_at: mockData.created_at,
        findings: mockData.findings,
      }
    }
  }

  // 3. Fallback to predefined sample reviews
  if (!reviewData) {
    if (id === "sample-1") {
      reviewData = {
        id: "sample-1",
        project_name: "payment-gateway-handler",
        file_name: "stripe-webhook.js",
        language: "javascript",
        overall_score: 64,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        summary: "Static analysis identified 2 critical security issues concerning SQL injection vectors and hardcoded API tokens. AI review suggests upgrading authentication handling and migrating secrets to env config.",
        code: `const stripe = require('stripe')('sk_test_51Nz...');
const express = require('express');
const app = express();

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  let event = req.body;
  // Hardcoded SQL Query susceptible to injection
  const query = "SELECT * FROM payments WHERE transaction_id = '" + event.id + "'";
  db.query(query, (err, result) => {
    if (err) throw err;
    console.log("Payment processed: ", result);
  });
  res.send();
});`,
        findings: [
          {
            id: "sf-1",
            severity: "critical",
            issue: "SQL Injection Vulnerability",
            explanation: "Variables should not be concatenated directly into raw SQL statements. This leaves your code vulnerable to malicious input manipulation that could leak database tables. Use parameterized queries instead.",
            suggested_fix: "const query = 'SELECT * FROM payments WHERE transaction_id = ?';\ndb.query(query, [event.id], (err, result) => { ... });",
            line_number: 8,
            file_name: "stripe-webhook.js",
          },
          {
            id: "sf-2",
            severity: "critical",
            issue: "Hardcoded API Key secret detected",
            explanation: "Hardcoded credentials can easily be leaked to public repositories. Move secret API keys to environment variables using process.env.",
            suggested_fix: "const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);",
            line_number: 1,
            file_name: "stripe-webhook.js",
          },
          {
            id: "sf-3",
            severity: "warning",
            issue: "Use of 'var' instead of const/let",
            explanation: "ESLint triggered [no-var] rule. Declaring variables using var is deprecated due to scope hoisting. Use let or const for block scoping.",
            suggested_fix: "const express = require('express');",
            line_number: 2,
            file_name: "stripe-webhook.js",
          },
        ],
      }
    } else if (id === "sample-2") {
      reviewData = {
        id: "sample-2",
        project_name: "data-ingestion-processor",
        file_name: "ingest.py",
        language: "python",
        overall_score: 91,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        summary: "Excellent code quality. PEP 8 compliant, solid error logging, and correct bracket alignment. Minimal complexity identified. Suggests adding function type hints for better type safety.",
        code: `import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

def calculate_total(items: List[Dict[str, float]]) -> float:
    """Calculates the total price of a list of items."""
    total = 0.0
    for item in items:
        price = item.get("price", 0.0)
        total += price
    return total`,
        findings: [
          {
            id: "sf-4",
            severity: "minor",
            issue: "Docstring formatting recommendation",
            explanation: "Ensure docstrings describe return type structures to increase code clarity for other developers.",
            line_number: 6,
            file_name: "ingest.py",
          },
          {
            id: "sf-5",
            severity: "info",
            issue: "Type Annotations match checks",
            explanation: "Consider using TypedDict for specifying keys of the items list elements (e.g. key 'price' maps to float) for stronger static type validation.",
            line_number: 6,
            file_name: "ingest.py",
          },
        ],
      }
    }
  }

  if (!reviewData) {
    notFound()
  }

  return <ReviewDetail data={reviewData} />
}
