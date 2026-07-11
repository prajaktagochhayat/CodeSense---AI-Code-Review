"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { toast } from "sonner"
import { 
  Search, 
  PlusCircle, 
  Terminal, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  FileCode,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Cpu,
  ShieldAlert,
  BarChart3
} from "lucide-react"

export interface ReviewItem {
  id: string
  overall_score: number
  summary: string
  created_at: string
  file_name: string
  project_name: string
  language: string
  findings_summary: {
    critical: number
    warning: number
    minor: number
    info: number
  }
}

interface DashboardOverviewProps {
  initialReviews: ReviewItem[]
}

export function DashboardOverview({ initialReviews }: DashboardOverviewProps) {
  const router = useRouter()
  const supabase = createClient()

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [search, setSearch] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("all")
  const [greeting, setGreeting] = useState("Hello")
  
  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Calculate greeting dynamically
  useEffect(() => {
    const hrs = new Date().getHours()
    if (hrs < 12) setGreeting("Good Morning")
    else if (hrs < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  // Filters
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.project_name.toLowerCase().includes(search.toLowerCase()) ||
      review.file_name.toLowerCase().includes(search.toLowerCase()) ||
      review.summary.toLowerCase().includes(search.toLowerCase())

    const matchesLanguage = selectedLanguage === "all" || review.language === selectedLanguage

    return matchesSearch && matchesLanguage
  })

  // Statistics calculation
  const totalReviews = reviews.length
  const avgScore = totalReviews > 0 
    ? Math.round(reviews.reduce((sum, r) => sum + r.overall_score, 0) / totalReviews) 
    : 0
  const criticalCount = reviews.reduce((sum, r) => sum + r.findings_summary.critical, 0)
  const uniqueProjects = new Set(reviews.map((r) => r.project_name)).size

  // Prepare chart data: language distribution
  const langCounts = reviews.reduce((acc: Record<string, number>, r) => {
    acc[r.language] = (acc[r.language] || 0) + 1
    return acc
  }, {})
  const langChartData = Object.entries(langCounts).map(([name, count]) => ({
    name: name.toUpperCase(),
    Reviews: count,
  }))

  // Prepare chart data: quality trends over past reviews (oldest to newest)
  const trendChartData = [...reviews]
    .reverse()
    .slice(-7) // last 7 reviews
    .map((r, i) => ({
      name: `Rev ${i + 1}`,
      Score: r.overall_score,
    }))

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)

    try {
      if (deleteId.startsWith("mock-") || deleteId.startsWith("sample-")) {
        // In-memory or sample deletion
        if (globalThis && (globalThis as any).mockReviews) {
          delete (globalThis as any).mockReviews[deleteId]
        }
        setReviews(reviews.filter((r) => r.id !== deleteId))
        toast.success("Review deleted successfully")
      } else {
        // Supabase deletion
        const { error } = await supabase.from("reviews").delete().eq("id", deleteId)
        if (error) throw error
        
        setReviews(reviews.filter((r) => r.id !== deleteId))
        toast.success("Review deleted successfully")
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#A8E6CF]"
    if (score >= 75) return "text-[#FFE082]"
    if (score >= 50) return "text-[#FFB86B]"
    return "text-[#FF8A65]"
  }

  const getScoreStroke = (score: number) => {
    if (score >= 90) return "#A8E6CF"
    if (score >= 75) return "#FFE082"
    if (score >= 50) return "#FFB86B"
    return "#FF8A65"
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Banner Header details */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {greeting} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Welcome to your dashboard. Review reports, history and settings.
          </p>
        </div>

        {/* Action center header */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3.5 py-1.5 rounded-2xl bg-[#FFE082]/10 border-[#FFE082]/20 text-foreground font-semibold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            AI Credits: 120 / 150
          </Badge>
          <Link href="/dashboard/new">
            <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-5 py-5 rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300">
              <PlusCircle className="h-5 w-5" />
              New Review
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Row Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        
        <Card className="border-border bg-card/65 backdrop-blur-md rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reviews</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Terminal className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-foreground">{totalReviews}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Processed snippets/files</p>
          </div>
        </Card>

        <Card className="border-border bg-card/65 backdrop-blur-md rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="h-8 w-8 rounded-xl bg-[#FFE082]/20 text-accent flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#FF8A65]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-foreground">{avgScore}%</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Overall codebase quality</p>
          </div>
        </Card>

        <Card className="border-border bg-card/65 backdrop-blur-md rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Issues</span>
            <div className="h-8 w-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-[#FF8A65]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-foreground">{criticalCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">High risk fixes required</p>
          </div>
        </Card>

        <Card className="border-border bg-card/65 backdrop-blur-md rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Projects Active</span>
            <div className="h-8 w-8 rounded-xl bg-[#CDB4FF]/10 text-primary flex items-center justify-center">
              <Cpu className="h-4 w-4 text-[#CDB4FF]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-foreground">{uniqueProjects}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Unique project setups</p>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      {totalReviews > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Chart 1: Quality Trend */}
          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4.5 w-4.5 text-[#FF8A65]" />
              <h4 className="text-sm font-extrabold text-foreground">Code Quality Trend</h4>
            </div>
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB86B" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#FFB86B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      background: "#FFF5EC",
                      borderColor: "rgba(0,0,0,0.06)",
                      fontSize: 11,
                      borderRadius: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="Score" stroke="#FF8A65" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Language breakdown */}
          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4.5 w-4.5 text-[#FF8A65]" />
              <h4 className="text-sm font-extrabold text-foreground">Language Distribution</h4>
            </div>
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={langChartData} barSize={16}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                    contentStyle={{
                      background: "#FFF5EC",
                      borderColor: "rgba(0,0,0,0.06)",
                      fontSize: 11,
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="Reviews" fill="#FFE082" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Filter and search control board */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card/45 backdrop-blur-md p-4 rounded-3xl border border-border shadow-xs">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews by project, file name, or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-border rounded-2xl focus-visible:ring-primary w-full py-5"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedLanguage} onValueChange={(val) => {
            if (val) setSelectedLanguage(val)
          }}>
            <SelectTrigger className="bg-background/50 border-border rounded-2xl focus-visible:ring-primary py-5">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-2xl">
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="go">Go</SelectItem>
              <SelectItem value="rust">Rust</SelectItem>
              <SelectItem value="csharp">C#</SelectItem>
              <SelectItem value="php">PHP</SelectItem>
              <SelectItem value="ruby">Ruby</SelectItem>
              <SelectItem value="swift">Swift</SelectItem>
              <SelectItem value="kotlin">Kotlin</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review History Cards Grid */}
      {filteredReviews.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {filteredReviews.map((review) => {
            const scorePercent = review.overall_score
            // SVG circular calculations
            const radius = 22
            const circumference = 2 * Math.PI * radius
            const strokeDashoffset = circumference - (scorePercent / 100) * circumference

            return (
              <Card 
                key={review.id} 
                className="border-border bg-card/50 backdrop-blur-md hover:bg-card hover:shadow-xl transition duration-300 rounded-3xl relative overflow-hidden group border border-border"
              >
                {/* Left primary accent strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover:bg-primary transition-all" />

                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 pl-6 pt-6">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[9px] uppercase font-bold text-accent border-[#FF8A65]/20 bg-[#FF8A65]/5 rounded-lg py-0.5">
                        {review.language}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-base font-extrabold truncate text-foreground group-hover:text-primary transition-colors pr-6">
                      {review.project_name}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1 text-muted-foreground">
                      <FileCode className="h-3.5 w-3.5 text-muted-foreground/80" />
                      {review.file_name}
                    </CardDescription>
                  </div>

                  {/* Circular SVG overall score ring gauge */}
                  <div className="relative h-14 w-14 flex-shrink-0">
                    <svg className="h-full w-full transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        className="stroke-muted-foreground/10"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke={getScoreStroke(scorePercent)}
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-black ${getScoreColor(scorePercent)}`}>
                        {scorePercent}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pl-6 pb-6 pr-6">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {review.summary}
                  </p>

                  {/* Category severity indicators */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/40">
                    {review.findings_summary.critical > 0 && (
                      <Badge variant="outline" className="bg-[#FF8A65]/10 text-[#FF8A65] border-[#FF8A65]/20 text-[9px] font-bold rounded-lg px-2">
                        {review.findings_summary.critical} critical
                      </Badge>
                    )}
                    {review.findings_summary.warning > 0 && (
                      <Badge variant="outline" className="bg-[#FFB86B]/10 text-[#FFB86B] border-[#FFB86B]/20 text-[9px] font-bold rounded-lg px-2">
                        {review.findings_summary.warning} warnings
                      </Badge>
                    )}
                    {review.findings_summary.minor > 0 && (
                      <Badge variant="outline" className="bg-[#FFE082]/10 text-amber-500 border-[#FFE082]/20 text-[9px] font-bold rounded-lg px-2">
                        {review.findings_summary.minor} minor
                      </Badge>
                    )}
                    {review.findings_summary.critical === 0 && review.findings_summary.warning === 0 && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold rounded-lg px-2">
                        ✓ Clean Build
                      </Badge>
                    )}
                  </div>

                  {/* bottom controls */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#FF8A65] hover:bg-[#FF8A65]/10 hover:text-[#FF8A65] p-0 h-9 w-9 rounded-xl transition duration-300"
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteId(review.id)
                      }}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                    
                    <Link href={`/dashboard/review/${review.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-primary font-bold hover:bg-primary/5 hover:text-accent gap-1 py-1.5 px-3.5 rounded-xl">
                        View Report
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border border-dashed bg-card/20 py-16 text-center rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-1.5 text-foreground">No Code Reviews Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
              Create your first automated code review report to analyze code health and find security vulnerabilities.
            </p>
            <Link href="/dashboard/new">
              <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-5 rounded-2xl shadow-md">
                Start First Review
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-card border-border rounded-3xl max-w-md shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 font-extrabold text-lg">
              <AlertTriangle className="h-5 w-5" />
              Delete Code Review?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to permanently delete this code review report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
              className="border-border hover:bg-muted rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
