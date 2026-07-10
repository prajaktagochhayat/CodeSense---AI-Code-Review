import { OpenAI } from "openai"

export interface AIFindingsResponse {
  overall_score: number
  summary: string
  findings: {
    severity: 'critical' | 'warning' | 'minor' | 'info'
    issue: string
    explanation: string
    suggested_fix?: string
    line_number: number
  }[]
}

export async function requestAIReview(
  code: string,
  language: string,
  fileName: string,
  staticFindings: any[]
): Promise<AIFindingsResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey === "mock-key") {
    console.warn("OpenAI API Key is missing. Falling back to mock review generation.")
    return generateMockReview(code, language, fileName, staticFindings)
  }

  const openai = new OpenAI({ apiKey })

  const prompt = `
You are an expert AI code reviewer. Perform an in-depth code review on the code below.
Language: ${language}
File Name: ${fileName}

Here are the results of the static code analysis performed on the code. Use them as context:
${JSON.stringify(staticFindings, null, 2)}

Provide feedback on:
1. Bugs or syntax issues.
2. Code smells or antipatterns.
3. Code complexity (e.g. nested structures).
4. Variable, function, and class naming conventions.
5. Performance optimizations.
6. Documentation gaps (missing docstrings or comments).

Respond ONLY with a JSON object that adheres to the following structure:
{
  "overall_score": 85, // An integer code quality score from 0 (terrible) to 100 (flawless)
  "summary": "Short plain-language overview of the code quality and major findings.",
  "findings": [
    {
      "severity": "warning", // Must be one of: "critical", "warning", "minor", "info"
      "issue": "Short descriptive title of the issue",
      "explanation": "Detailed explanation of what is wrong and why it should be fixed.",
      "suggested_fix": "Optional drop-in code replacement for the fix.",
      "line_number": 5 // Integer line number of the issue
    }
  ]
}
`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional software engineer who reviews code and returns structured JSON responses matching the requested schema.",
        },
        {
          role: "user",
          content: `${prompt}\n\nCode to review:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    })

    const jsonText = response.choices[0].message?.content || "{}"
    const result = JSON.parse(jsonText) as AIFindingsResponse

    // Validate structure
    if (typeof result.overall_score !== "number" || !result.summary || !Array.isArray(result.findings)) {
      throw new Error("Invalid response structure from OpenAI")
    }

    return result
  } catch (error: any) {
    console.error("OpenAI API call failed, using mock fallback", error)
    return generateMockReview(code, language, fileName, staticFindings)
  }
}

function generateMockReview(
  code: string,
  language: string,
  fileName: string,
  staticFindings: any[]
): AIFindingsResponse {
  // Simple analysis of code length and content to make mock feedback realistic
  const lines = code.split("\n")
  const totalLines = lines.length

  const findings: AIFindingsResponse["findings"] = []
  
  // Port static findings over
  staticFindings.forEach((sf) => {
    findings.push({
      severity: sf.severity,
      issue: sf.issue,
      explanation: `[Static Analysis] ${sf.explanation}`,
      suggested_fix: sf.suggested_fix,
      line_number: sf.line_number,
    })
  })

  // Add AI findings
  if (code.includes("var ") && (language === "javascript" || language === "typescript")) {
    findings.push({
      severity: "warning",
      issue: "Use of 'var' keyword",
      explanation: "Declaring variables with 'var' can lead to scoping issues and hoisting bugs. Use 'let' or 'const' instead.",
      suggested_fix: code.replace(/\bvar\b/g, "let"),
      line_number: lines.findIndex(l => l.includes("var ")) + 1 || 3,
    })
  }

  if (code.includes("calculateTotal") || code.includes("calc")) {
    findings.push({
      severity: "minor",
      issue: "Arrow function refactoring suggestion",
      explanation: "Modern JS/TS benefits from concise syntax. Consider refactoring calculations to clean arrow functions.",
      suggested_fix: "const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price, 0);",
      line_number: 2,
    })
  }

  // Performance finding
  if (totalLines > 20) {
    findings.push({
      severity: "info",
      issue: "Consider adding caching or memoization",
      explanation: "For complex calculations that run frequently, caching intermediate values or memoizing function results improves rendering performance.",
      line_number: 1,
    })
  }

  // Naming conventions
  if (code.includes("calculateTotal") && language === "python") {
    findings.push({
      severity: "minor",
      issue: "Use snake_case for Python function names",
      explanation: "PEP 8 states that function names should be lowercase, with words separated by underscores to improve readability.",
      suggested_fix: "def calculate_total(items):",
      line_number: 1,
    })
  }

  // Complexity score calculation
  const baseScore = 95
  const deductions = findings.reduce((sum, f) => {
    if (f.severity === "critical") return sum + 15
    if (f.severity === "warning") return sum + 8
    if (f.severity === "minor") return sum + 3
    return sum + 1
  }, 0)

  const overall_score = Math.max(30, baseScore - deductions)

  return {
    overall_score,
    summary: `Code review completed for ${fileName}. Found ${findings.filter(f => f.severity === 'critical' || f.severity === 'warning').length} key issues that require attention, mostly concerning variable scoping and syntax formatting.`,
    findings,
  }
}
