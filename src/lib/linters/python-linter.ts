interface LinterFinding {
  severity: 'critical' | 'warning' | 'minor' | 'info'
  issue: string;
  explanation: string;
  suggested_fix?: string;
  line_number: number;
}

export function lintPython(code: string): LinterFinding[] {
  const findings: LinterFinding[] = []
  const lines = code.split("\n")

  // Check parenthesis stack
  const parenStack: { char: string; line: number }[] = []
  const bracesMap: Record<string, string> = { ")": "(", "}": "{", "]": "[" }

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    // 1. Missing Colons on block definitions
    const blockHeaders = /^(def|class|if|elif|else|for|while|try|except)\b/
    if (blockHeaders.test(trimmed) && !trimmed.endsWith(":")) {
      findings.push({
        severity: "critical",
        issue: `Missing colon (:) at end of statement`,
        explanation: `Python requires a colon at the end of '${trimmed.split(" ")[0]}' block headers.`,
        suggested_fix: `${line}:`,
        line_number: lineNum,
      })
    }

    // 2. JS keywords in Python
    const jsKeywords = /\b(const|let|var|function)\b/
    if (jsKeywords.test(trimmed)) {
      const match = trimmed.match(jsKeywords)?.[0]
      findings.push({
        severity: "critical",
        issue: `JavaScript keyword '${match}' detected in Python code`,
        explanation: `Python does not support JavaScript variable/function declarations like '${match}'.`,
        suggested_fix: trimmed.replace(/^(const|let|var)\s+/, "").replace(/^function\s+(\w+)\s*\((.*)\)/, "def $1($2):"),
        line_number: lineNum,
      })
    }

    // 3. Logical Operators (&& / ||)
    if (trimmed.includes("&&")) {
      findings.push({
        severity: "critical",
        issue: "Logical operator '&&' detected",
        explanation: "Python uses 'and' for logical conjunction instead of '&&'.",
        suggested_fix: line.replace(/&&/g, "and"),
        line_number: lineNum,
      })
    }
    if (trimmed.includes("||")) {
      findings.push({
        severity: "critical",
        issue: "Logical operator '||' detected",
        explanation: "Python uses 'or' for logical disjunction instead of '||'.",
        suggested_fix: line.replace(/\|\|/g, "or"),
        line_number: lineNum,
      })
    }

    // 4. Python 2 print style in Python 3
    if (trimmed.startsWith("print ") && !trimmed.startsWith("print(") && !trimmed.startsWith("print_")) {
      findings.push({
        severity: "warning",
        issue: "Python 2 style print statement",
        explanation: "Print is a function in Python 3. It should be used with parentheses: print(...)",
        suggested_fix: line.replace(/print\s+(.*)/, "print($1)"),
        line_number: lineNum,
      })
    }

    // 5. Indentation mix (tabs and spaces)
    if (line.startsWith(" ") && line.includes("\t")) {
      findings.push({
        severity: "warning",
        issue: "Mixed indentation of tabs and spaces",
        explanation: "Mixed indentation can lead to IndentationError runtimes in Python.",
        suggested_fix: line.replace(/\t/g, "    "),
        line_number: lineNum,
      })
    }

    // Track matching braces
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx]
      if (["(", "[", "{"].includes(char)) {
        parenStack.push({ char, line: lineNum })
      } else if ([")", "]", "}"].includes(char)) {
        const expected = bracesMap[char]
        const last = parenStack.pop()
        if (!last || last.char !== expected) {
          findings.push({
            severity: "critical",
            issue: `Unmatched closing bracket '${char}'`,
            explanation: `Detected an unmatched closing bracket '${char}' on line ${lineNum}.`,
            line_number: lineNum,
          })
        }
      }
    }
  })

  // Any leftover unclosed brackets
  parenStack.forEach((bracket) => {
    findings.push({
      severity: "critical",
      issue: `Unclosed opening bracket '${bracket.char}'`,
      explanation: `The opening bracket '${bracket.char}' on line ${bracket.line} was never closed.`,
      line_number: bracket.line,
    })
  })

  return findings
}
