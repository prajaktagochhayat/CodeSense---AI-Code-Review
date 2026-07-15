"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { computeComplexityMetrics } from "@/lib/metrics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import confetti from "canvas-confetti"
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { 
  ArrowLeft, 
  Terminal, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  FileCode, 
  Braces,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Share2
} from "lucide-react"

export interface Finding {
  id: string
  severity: "critical" | "warning" | "minor" | "info"
  issue: string
  explanation: string
  suggested_fix?: string
  line_number: number
  file_name: string
}

export interface ReviewDetailData {
  id: string
  project_name: string
  language: string
  overall_score: number
  summary: string
  code: string
  file_name: string
  created_at: string
  findings: Finding[]
}

interface ReviewDetailProps {
  data: ReviewDetailData
}

export function ReviewDetail({ data }: ReviewDetailProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Complexity metrics
  const metrics = computeComplexityMetrics(data.code, data.language)

  useEffect(() => {
    setMounted(true)

    // Trigger confetti celebration for outstanding reviews (score >= 90)
    if (data.overall_score >= 90) {
      const duration = 2 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }))
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }))
      }, 250)
    }
  }, [data.overall_score])

  // Filter findings
  const filteredFindings = data.findings.filter((f) => {
    return selectedSeverity === "all" || f.severity === selectedSeverity
  }).sort((a, b) => a.line_number - b.line_number)

  const handleCopyFix = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Suggested fix copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#A8E6CF]"
    if (score >= 75) return "text-[#FFE082]"
    if (score >= 50) return "text-[#FFB86B]"
    return "text-[#FF8A65]"
  }

  const getScoreTrackColor = (score: number) => {
    if (score >= 90) return "#A8E6CF"
    if (score >= 75) return "#FFE082"
    if (score >= 50) return "#FFB86B"
    return "#FF8A65"
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon className="h-4.5 w-4.5 text-[#FF8A65] flex-shrink-0" />
      case "warning":
        return <AlertTriangle className="h-4.5 w-4.5 text-[#FFB86B] flex-shrink-0" />
      case "minor":
        return <AlertTriangle className="h-4.5 w-4.5 text-[#FFE082] flex-shrink-0" />
      default:
        return <Info className="h-4.5 w-4.5 text-blue-400 flex-shrink-0" />
    }
  }

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case "critical": return "border-[#FF8A65]/25 bg-[#FF8A65]/5 hover:bg-[#FF8A65]/10"
      case "warning": return "border-[#FFB86B]/25 bg-[#FFB86B]/5 hover:bg-[#FFB86B]/10"
      case "minor": return "border-[#FFE082]/25 bg-[#FFE082]/5 hover:bg-[#FFE082]/10"
      default: return "border-blue-400/25 bg-blue-400/5 hover:bg-blue-400/10"
    }
  }

  // Chart Data preparation
  const scoreData = [
    {
      name: "Score",
      value: data.overall_score,
      fill: getScoreTrackColor(data.overall_score),
    },
  ]

  const metricsChartData = [
    { name: "Total Lines", count: metrics.totalLines },
    { name: "Functions", count: metrics.functionsCount * 10 }, 
    { name: "Complexity", count: metrics.cyclomaticComplexity * 5 }, 
    { name: "Classes", count: metrics.classesCount * 20 }, 
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Navigation and Share toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 border border-border bg-card/45 rounded-2xl shadow-xs py-4 px-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <Button variant="ghost" size="sm" onClick={() => toast.success("Report shared successfully!")} className="text-muted-foreground hover:text-foreground gap-1.5 border border-border bg-card/45 rounded-2xl py-4 px-4">
          <Share2 className="h-4 w-4" />
          Share Report
        </Button>
      </div>

      {/* Header Profile Title */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs uppercase font-bold text-accent border-accent/20 bg-accent/5 rounded-lg py-0.5">
              {data.language}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Reviewed on {new Date(data.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {data.project_name}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileCode className="h-4 w-4 text-muted-foreground/80" />
            {data.file_name}
          </p>
        </div>
      </div>

      {/* Score gauge and Recharts chart row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SVG/Recharts Score Ring */}
        <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl flex flex-col justify-between overflow-hidden shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Code Quality Rating</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[160px] pb-6">
            {mounted ? (
              <div className="relative h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="80%"
                    outerRadius="100%"
                    barSize={8}
                    data={scoreData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={4}
                      angleAxisId={0}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${getScoreColor(data.overall_score)}`}>
                    {data.overall_score}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5 tracking-wider">Score</span>
                </div>
              </div>
            ) : (
              <div className="h-32 w-32 rounded-full border-4 border-dashed border-muted animate-spin" />
            )}
          </CardContent>
        </Card>

        {/* Recharts Complexity breakdown chart */}
        <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl md:col-span-2 flex flex-col justify-between shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Codebase Complexity Metrics</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center min-h-[160px] pb-5">
            {mounted ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={metricsChartData} barSize={18}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                    contentStyle={{
                      background: "#FFF5EC",
                      borderColor: "rgba(0,0,0,0.06)",
                      fontSize: 11,
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {metricsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? "#FF8A65" : "#FFB86B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 w-full bg-muted/20 animate-pulse rounded-lg" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Details and editor tabs */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column stats */}
        <div className="md:col-span-1 space-y-6">
          {/* AI Summary card */}
          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-accent" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.summary}
              </p>
            </CardContent>
          </Card>

          {/* Complexity details breakdown panel */}
          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Braces className="h-4.5 w-4.5 text-accent" />
                Complexity Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Total Lines</span>
                <span className="font-bold">{metrics.totalLines}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Functions</span>
                <span className="font-bold">{metrics.functionsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Classes</span>
                <span className="font-bold">{metrics.classesCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Cyclomatic Complexity</span>
                <span className="font-bold">{metrics.cyclomaticComplexity}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
                <span className="text-muted-foreground">Avg Func Complexity</span>
                <span className="font-bold">{metrics.avgFunctionComplexity}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Complexity Rating</span>
                <Badge variant="outline" className={`text-[9px] font-bold rounded-lg ${
                  metrics.fileComplexityRating === 'Low' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                  metrics.fileComplexityRating === 'Moderate' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                }`}>
                  {metrics.fileComplexityRating}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column findings cards and editor workspace */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="findings" className="w-full">
            <div className="flex items-center justify-between mb-4 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
              <TabsList className="bg-transparent border-0 gap-1">
                <TabsTrigger value="findings" className="text-xs rounded-xl py-2">
                  Review Findings ({data.findings.length})
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs rounded-xl py-2">
                  Source Code
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Findings list tab */}
            <TabsContent value="findings" className="mt-0">
              <Card className="border-border bg-card/20 rounded-3xl overflow-hidden shadow-2xl">
                <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 px-5 pt-5">
                  <div>
                    <CardTitle className="text-sm font-extrabold">Findings List</CardTitle>
                    <CardDescription className="text-[10px]">Filter findings by severity tags below</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 bg-background/50 p-1 rounded-xl border border-border/40">
                    {["all", "critical", "warning", "minor", "info"].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSelectedSeverity(sev)}
                        className={`text-[9px] font-bold capitalize px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                          selectedSeverity === sev
                            ? "bg-primary border-primary text-primary-foreground shadow-xs"
                            : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {filteredFindings.length > 0 ? (
                    filteredFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className={`border rounded-2xl p-4 transition-all duration-300 ${getSeverityBorder(finding.severity)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {getSeverityIcon(finding.severity)}
                            <div>
                              <h4 className="text-xs font-bold text-foreground">
                                {finding.issue}
                              </h4>
                              <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                                Line {finding.line_number} • {finding.file_name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[8px] uppercase font-bold px-2 bg-background border-border rounded-lg">
                            {finding.severity}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed pl-7">
                          {finding.explanation}
                        </p>

                        {/* Suggested Fix and copy block */}
                        {finding.suggested_fix && (
                          <div className="mt-4 pl-7 space-y-2">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Suggested Fix:</span>
                            <div className="rounded-xl bg-[#2D2D2D] border border-border overflow-hidden">
                              <div className="bg-[#201D1A] border-b border-border/20 px-3.5 py-1.5 flex items-center justify-between">
                                <span className="text-[9px] font-mono text-zinc-400">Diff Preview</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleCopyFix(finding.suggested_fix!, finding.id)} 
                                  className="h-7 px-2 hover:bg-white/10 hover:text-white text-zinc-400 rounded-lg"
                                >
                                  {copiedId === finding.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                              <pre className="p-3.5 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed bg-[#171513]">
                                {finding.suggested_fix}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CheckCircle2 className="h-10 w-10 text-[#A8E6CF]/60 mb-2" />
                      <h4 className="text-sm font-bold text-foreground">Clean build category</h4>
                      <p className="text-xs text-muted-foreground mt-1">This segment is completely clear of issues for this filter.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Read-only Code viewer tab */}
            <TabsContent value="code" className="mt-0">
              <Card className="border-border overflow-hidden rounded-3xl shadow-2xl">
                <div className="bg-muted/50 border-b border-border/40 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 font-mono">
                    <Terminal className="h-3.5 w-3.5" />
                    Source Viewer
                  </span>
                  <Badge variant="outline" className="font-mono text-[9px] uppercase text-accent border-accent/20 bg-accent/5 rounded-lg py-0.5">
                    {data.language}
                  </Badge>
                </div>
                <div className="h-[450px]">
                  <Editor
                    height="100%"
                    language={data.language}
                    theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                    value={data.code}
                    options={{
                      readOnly: true,
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontFamily: "JetBrains Mono, monospace",
                      lineHeight: 22,
                    }}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// toast loader wrapper helper
const toast = {
  success: (msg: string) => {
    // dynamically access the Sonner toast notification
    const { toast: sonnerToast } = require("sonner")
    sonnerToast.success(msg)
  }
}
