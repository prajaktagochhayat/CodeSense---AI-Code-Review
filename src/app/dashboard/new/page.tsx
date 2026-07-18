"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Terminal, 
  UploadCloud, 
  FileCode, 
  Code, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Activity,
  Cpu,
  Sparkles,
  Maximize2
} from "lucide-react"

export default function NewReviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const { resolvedTheme } = useTheme()

  const [projectName, setProjectName] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(`// Paste your code here\nfunction calculateTotal(items) {\n  let total = 0;\n  for(var i=0; i<items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}`)
  const [file, setFile] = useState<File | null>(null)
  
  // Pipeline loading states
  const [submitting, setSubmitting] = useState(false)
  const [pipelineStage, setPipelineStage] = useState<"idle" | "uploading" | "static" | "ai" | "saving">("idle")
  
  // Micro-stage simulation for AI reviews
  const [aiSubStage, setAiSubStage] = useState(0)

  // Simulation loop for AI sub-stages
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (pipelineStage === "ai") {
      setAiSubStage(0)
      interval = setInterval(() => {
        setAiSubStage((prev) => {
          if (prev < 4) return prev + 1
          clearInterval(interval)
          return prev
        })
      }, 900)
    }
    return () => clearInterval(interval)
  }, [pipelineStage])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Auto-detect language by file extension
      const ext = selectedFile.name.split(".").pop()?.toLowerCase()
      if (ext) {
        if (ext === "js" || ext === "jsx") setLanguage("javascript")
        else if (ext === "ts" || ext === "tsx") setLanguage("typescript")
        else if (ext === "html" || ext === "htm") setLanguage("html")
        else if (ext === "css") setLanguage("css")
        else if (ext === "py") setLanguage("python")
        else if (ext === "cpp" || ext === "cc" || ext === "h") setLanguage("cpp")
        else if (ext === "java") setLanguage("java")
        else if (ext === "go") setLanguage("go")
        else if (ext === "rs") setLanguage("rust")
        else if (ext === "cs") setLanguage("csharp")
        else if (ext === "php") setLanguage("php")
        else if (ext === "rb") setLanguage("ruby")
        else if (ext === "swift") setLanguage("swift")
        else if (ext === "kt" || ext === "kts") setLanguage("kotlin")
        else if (ext === "sql") setLanguage("sql")
      }

      // Read file content
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setCode(event.target.result as string)
        }
      }
      reader.readAsText(selectedFile)
      toast.success(`Successfully uploaded ${selectedFile.name}`)
    }
  }

  const handleSubmit = async (activeTab: string) => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name")
      return
    }

    if (activeTab === "upload" && !file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!code.trim()) {
      toast.error("Please provide code content for review")
      return
    }

    setSubmitting(true)
    let fileUrl = ""
    
    try {
      if (activeTab === "upload" && file) {
        setPipelineStage("uploading")
        
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `reviews/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("source-files")
          .upload(filePath, file)

        if (uploadError) {
          console.warn("Storage upload failed, proceeding with in-memory code submission", uploadError)
        } else {
          fileUrl = filePath
        }
      }

      // Transition stages
      setPipelineStage("static")
      await new Promise((r) => setTimeout(r, 800)) // cosmetic pause
      
      setPipelineStage("ai")
      
      // Trigger full pipeline via API route
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          language,
          code,
          fileName: activeTab === "upload" ? file?.name : "main.js",
          fileUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Code review pipeline failed")
      }

      // Wait for sub-stage animation to complete
      await new Promise((r) => setTimeout(r, 4500))

      setPipelineStage("saving")
      const result = await response.json()
      
      // Cache mock reviews locally to handle serverless stateless routing
      if (result.reviewId.startsWith("mock-")) {
        const localMockCache = JSON.parse(localStorage.getItem("mockReviews") || "{}")
        localMockCache[result.reviewId] = {
          id: result.reviewId,
          project_name: projectName,
          language,
          overall_score: result.score,
          summary: "This report was generated in mock review mode. Local simulation completed successfully.",
          code,
          file_name: activeTab === "upload" ? file?.name : "main.js",
          created_at: new Date().toISOString(),
          findings: [
            {
              id: "mock-finding-1",
              severity: "warning",
              issue: "Local Storage Simulation mode active",
              explanation: "Database query bypass mode is active. Displaying mock code review details successfully in client sandbox.",
              line_number: 1,
              file_name: activeTab === "upload" ? file?.name : "main.js"
            }
          ]
        }
        localStorage.setItem("mockReviews", JSON.stringify(localMockCache))
      }

      toast.success("Review complete! Redirecting to report...")
      router.push(`/dashboard/review/${result.reviewId}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
      setPipelineStage("idle")
      setSubmitting(false)
    }
  }

  // Micro stages definitions for AI feedback progress list
  const aiStages = [
    { label: "Initializing AI Review Engine", stage: "static", sub: 0 },
    { label: "Analyzing Syntactic Structures", stage: "static", sub: 0 },
    { label: "Checking Security and Vulnerabilities", stage: "ai", sub: 0 },
    { label: "Locating Logical Bugs & Code Smells", stage: "ai", sub: 1 },
    { label: "Evaluating Performance & Memory leaks", stage: "ai", sub: 2 },
    { label: "Generating Refactoring Suggestions", stage: "ai", sub: 3 },
    { label: "Compiling Final Report Data", stage: "saving", sub: 4 }
  ]

  const getStageStatus = (index: number, stage: string, sub: number) => {
    if (!submitting) return "idle"

    if (pipelineStage === "saving") {
      if (stage === "saving") return "active"
      return "checked"
    }

    if (pipelineStage === "static") {
      if (stage === "static") return "active"
      return "idle"
    }

    if (pipelineStage === "ai") {
      if (stage === "static") return "checked"
      if (stage === "ai") {
        if (aiSubStage === sub) return "active"
        if (aiSubStage > sub) return "checked"
        return "idle"
      }
      return "idle"
    }

    return "idle"
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Profile Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          New Code Review
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Paste your code snippet or upload a script file to initiate Stage 1 and Stage 2 analysis.
        </p>
      </div>

      {/* 12-column responsive layout grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Configuration Column panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl shadow-xl p-5">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-md font-extrabold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Configuration
              </CardTitle>
              <CardDescription className="text-xs">Specify the project context and rules</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. payment-refactor"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={submitting}
                  className="bg-background/40 border-border rounded-2xl focus-visible:ring-primary py-5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Language Model</Label>
                <Select
                  value={language}
                  onValueChange={(val) => {
                    if (val) setLanguage(val)
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger id="language" className="bg-background/40 border-border rounded-2xl py-5">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-2xl shadow-xl">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">Web Languages</SelectLabel>
                      <SelectItem value="javascript" className="rounded-xl cursor-pointer">JavaScript</SelectItem>
                      <SelectItem value="typescript" className="rounded-xl cursor-pointer">TypeScript</SelectItem>
                      <SelectItem value="html" className="rounded-xl cursor-pointer">HTML</SelectItem>
                      <SelectItem value="css" className="rounded-xl cursor-pointer">CSS</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5 mt-2">Backend & Systems</SelectLabel>
                      <SelectItem value="python" className="rounded-xl cursor-pointer">Python</SelectItem>
                      <SelectItem value="cpp" className="rounded-xl cursor-pointer">C++</SelectItem>
                      <SelectItem value="java" className="rounded-xl cursor-pointer">Java</SelectItem>
                      <SelectItem value="go" className="rounded-xl cursor-pointer">Go</SelectItem>
                      <SelectItem value="rust" className="rounded-xl cursor-pointer">Rust</SelectItem>
                      <SelectItem value="csharp" className="rounded-xl cursor-pointer">C#</SelectItem>
                      <SelectItem value="php" className="rounded-xl cursor-pointer">PHP</SelectItem>
                      <SelectItem value="ruby" className="rounded-xl cursor-pointer">Ruby</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5 mt-2">Mobile & Databases</SelectLabel>
                      <SelectItem value="swift" className="rounded-xl cursor-pointer">Swift</SelectItem>
                      <SelectItem value="kotlin" className="rounded-xl cursor-pointer">Kotlin</SelectItem>
                      <SelectItem value="sql" className="rounded-xl cursor-pointer">SQL</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Workflow Stages timeline panel */}
          {submitting && (
            <Card className="border-border bg-card/65 backdrop-blur-md rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 animate-pulse text-accent" />
                    Review Pipeline
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">Estimated time: 10s</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                
                {/* Micro stages list */}
                <div className="space-y-3.5">
                  {/* Pre-upload stage for files */}
                  {file && (
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-border/20">
                      <span className="text-muted-foreground">Uploading script file</span>
                      {pipelineStage === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#FF8A65]" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-[#A8E6CF] fill-[#A8E6CF]/10" />
                      )}
                    </div>
                  )}

                  {aiStages.map((stageItem, index) => {
                    const status = getStageStatus(index, stageItem.stage, stageItem.sub)
                    return (
                      <div key={index} className="flex items-center justify-between text-xs transition duration-300">
                        <span className={`transition-colors ${
                          status === "active" ? "text-foreground font-bold" :
                          status === "checked" ? "text-muted-foreground" : "text-muted-foreground/50"
                        }`}>
                          {stageItem.label}
                        </span>

                        {status === "active" && (
                          <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        )}
                        {status === "checked" && (
                          <CheckCircle2 className="h-4 w-4 text-[#A8E6CF] fill-[#A8E6CF]/10" />
                        )}
                        {status === "idle" && (
                          <div className="h-2 w-2 rounded-full bg-border" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Input Work area panel (7 cols) */}
        <div className="lg:col-span-7">
          <Tabs defaultValue="paste" className="w-full">
            <div className="flex items-center justify-between mb-4 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
              <TabsList className="bg-transparent border-0 gap-1">
                <TabsTrigger value="paste" className="flex items-center gap-2 rounded-xl text-xs py-2">
                  <Code className="h-4 w-4" />
                  Paste Snippet
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2 rounded-xl text-xs py-2">
                  <UploadCloud className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Paste Code Editor Workspace */}
            <TabsContent value="paste" className="mt-0">
              <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-muted/50 border-b border-border/40 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-2 font-mono">
                    <Terminal className="h-4 w-4 text-accent" />
                    Editor
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-primary/10 text-accent font-extrabold px-2.5 py-0.5 rounded-lg border border-primary/20">
                    {language}
                  </span>
                </div>
                <div className="h-[420px]">
                  <Editor
                    height="100%"
                    language={language}
                    theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                      fontSize: 16,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontFamily: "JetBrains Mono, monospace",
                      lineHeight: 24,
                    }}
                  />
                </div>
                <div className="bg-muted/50 border-t border-border/40 px-5 py-4 flex justify-end">
                  <Button
                    onClick={() => handleSubmit("paste")}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        Start Review
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Drag & Drop File Upload Grid */}
            <TabsContent value="upload" className="mt-0">
              <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                <CardContent className="pt-6 px-6">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-2xl px-6 py-16 text-center bg-background/10 hover:bg-background/30 transition-all duration-300">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-accent mb-5 border border-primary/10">
                      <UploadCloud className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1.5">
                      Drag and drop your source file here, or{" "}
                      <label className="text-accent hover:underline cursor-pointer">
                        browse files
                        <input
                          type="file"
                          onChange={handleFileChange}
                          disabled={submitting}
                          className="hidden"
                          accept=".js,.jsx,.ts,.tsx,.py,.cpp,.cc,.h,.java,.go,.rs"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">
                      Supports JavaScript, TypeScript, Python, C++, Java, Go, Rust
                    </p>
                    
                    {file && (
                      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left w-full max-w-sm shadow-sm animate-in zoom-in-95 duration-200">
                        <FileCode className="h-8 w-8 text-accent flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="bg-muted/50 border-t border-border/40 px-5 py-4 flex justify-end">
                  <Button
                    onClick={() => handleSubmit("upload")}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        Start Review
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
