import { Linter } from "eslint"

interface LinterFinding {
  severity: 'critical' | 'warning' | 'minor' | 'info'
  issue: string;
  explanation: string;
  suggested_fix?: string;
  line_number: number;
}

export function lintJavaScript(code: string): LinterFinding[] {
  try {
    const linter = new Linter()
    
    // We configure standard rules for JS/TS
    const messages = linter.verify(code, {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
      env: {
        es6: true,
        browser: true,
        node: true,
      },
      rules: {
        "no-unused-vars": "warn",
        "no-undef": "error",
        "no-empty": "warn",
        "semi": ["warn", "always"],
        "eqeqeq": ["warn", "always"],
        "no-console": "off",
        "no-constant-condition": "error",
        "no-debugger": "error",
        "no-duplicate-case": "error",
        "no-unreachable": "error",
      },
    })

    return messages.map((msg) => {
      // Map ESLint severity to our schema
      let severity: 'critical' | 'warning' | 'minor' | 'info' = 'info'
      if (msg.severity === 2) {
        severity = 'critical' // Errors are critical syntax/runtime issues
      } else if (msg.severity === 1) {
        if (msg.ruleId === 'no-unused-vars' || msg.ruleId === 'no-empty') {
          severity = 'warning'
        } else {
          severity = 'minor'
        }
      }

      return {
        severity,
        issue: msg.message,
        explanation: `Triggered by ESLint rule [${msg.ruleId}]. ${msg.message}`,
        suggested_fix: getSuggestedFix(msg.ruleId, code, msg.line),
        line_number: msg.line || 1,
      }
    })
  } catch (error: any) {
    console.error("ESLint execution error:", error)
    return [{
      severity: 'critical',
      issue: "Linter failure",
      explanation: `Could not parse JS/TS code: ${error.message || error}`,
      line_number: 1,
    }]
  }
}

function getSuggestedFix(ruleId: string | null, code: string, line: number): string | undefined {
  if (!ruleId) return undefined

  const lines = code.split("\n")
  const targetLine = lines[line - 1] || ""

  switch (ruleId) {
    case "semi":
      return targetLine.trim().endsWith(";") ? undefined : `${targetLine};`
    case "eqeqeq":
      if (targetLine.includes("==") && !targetLine.includes("===")) {
        return targetLine.replace("==", "===")
      }
      if (targetLine.includes("!=") && !targetLine.includes("!==")) {
        return targetLine.replace("!=", "!==")
      }
      return undefined
    default:
      return undefined
  }
}
