export interface ComplexityMetrics {
  totalLines: number
  functionsCount: number
  classesCount: number
  cyclomaticComplexity: number
  avgFunctionComplexity: number
  fileComplexityRating: "Low" | "Moderate" | "High" | "Very High"
}

export function computeComplexityMetrics(code: string, language: string): ComplexityMetrics {
  const lines = code.split("\n")
  const totalLines = lines.length

  let functionsCount = 0
  let classesCount = 0
  let branchingPoints = 0

  // Standard regexes
  const jsFunctionRegex = /\b(function\s+\w+|const\s+\w+\s*=\s*\(.*\)\s*=>|\w+\s*\([^)]*\)\s*\{)/g
  const pyFunctionRegex = /\bdef\s+\w+\s*\(/g
  const classRegex = /\bclass\s+\w+/g

  // Count functions & classes
  if (language === "python") {
    functionsCount = (code.match(pyFunctionRegex) || []).length
  } else {
    functionsCount = (code.match(jsFunctionRegex) || []).length
  }
  classesCount = (code.match(classRegex) || []).length

  // Cyclomatic Complexity estimation
  // Base complexity is 1. We add 1 for every branching keyword.
  const branchKeywords = [
    /\bif\b/g,
    /\belif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcatch\b/g,
    /\bcase\b/g,
    /\b&&\b/g,
    /\b\|\|\b/g,
    /\band\b/g,
    /\bor\b/g,
    /\?/g, // Ternary
  ]

  branchingPoints = branchKeywords.reduce((count, regex) => {
    return count + (code.match(regex) || []).length
  }, 0)

  const cyclomaticComplexity = 1 + branchingPoints
  
  // Calculate average function complexity
  let avgFunctionComplexity = 1
  if (functionsCount > 0) {
    avgFunctionComplexity = parseFloat((cyclomaticComplexity / functionsCount).toFixed(1))
  } else {
    avgFunctionComplexity = cyclomaticComplexity
  }

  // Determine file rating
  let fileComplexityRating: ComplexityMetrics["fileComplexityRating"] = "Low"
  if (cyclomaticComplexity > 15) {
    fileComplexityRating = "Very High"
  } else if (cyclomaticComplexity > 10) {
    fileComplexityRating = "High"
  } else if (cyclomaticComplexity > 5) {
    fileComplexityRating = "Moderate"
  }

  return {
    totalLines,
    functionsCount,
    classesCount,
    cyclomaticComplexity,
    avgFunctionComplexity,
    fileComplexityRating,
  }
}
