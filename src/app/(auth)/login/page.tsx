"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Terminal, Eye, EyeOff, Loader2 } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all email and password fields.")
      return
    }

    setLoading(true)

    // Bypass check for mock local test environments
    const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co" || !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isMock) {
      toast.success("Welcome back (Mock Mode Enabled)!")
      router.push("/dashboard")
      router.refresh()
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success("Signed in successfully! Redirecting...")
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Invalid login credentials. Please check and try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
      
      {/* Left Panel: Warm gradient illustration and floating snippets */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-tr from-[#FFF0E2] via-[#FFF9F2] to-[#FFE8D1] overflow-hidden border-r border-border">
        {/* Floating circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px] animate-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[80px] animate-blob-2" />
        
        {/* Top Header */}
        <div className="flex items-center gap-2.5 z-10">
          <BrandLogo className="h-9 w-9 shadow-sm" />
          <span className="text-xl font-bold tracking-tight text-foreground">CodeSense</span>
        </div>

        {/* Center illustration card */}
        <div className="flex flex-col items-center justify-center space-y-8 z-10 max-w-lg mx-auto">
          <div className="relative w-full rounded-3xl border border-border/80 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition duration-500 hover:scale-[1.02]">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2 font-mono">
                <Terminal className="h-4 w-4 text-accent" />
                review-processor.ts
              </span>
              <span className="text-[10px] uppercase font-bold text-[#A8E6CF] bg-[#A8E6CF]/10 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
            
            <pre className="pt-4 text-xs font-mono leading-relaxed text-[#2D2D2D]/90 overflow-x-auto">
{`// CodeSense AI Review Process
const analyzeComplexity = (code: string) => {
  const score = calculateHealth(code); // Result: 98%
  
  if (score > 90) {
    triggerConfettiReport(); // Clean Build!
  }
  return { score, status: "Secure" };
};`}
            </pre>

            {/* Glowing stats overlay inside illustration card */}
            <div className="absolute bottom-[-24px] right-[-24px] rounded-2xl bg-card border border-border p-4 shadow-lg flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                98
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground">Review Complete</p>
                <p className="text-[8px] text-muted-foreground">0 Issues found</p>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-2 mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Automated Code Quality
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Scan your files for logical errors, code smells, complexity, and performance gaps in milliseconds.
            </p>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="text-xs text-muted-foreground/75 z-10">
          © 2026 CodeSense. Warmly crafted for modern developers.
        </div>
      </div>

      {/* Right Panel: Auth panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2 bg-background relative">
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-secondary/15 blur-[90px] animate-blob-3" />
        
        <div className="w-full max-w-md space-y-6 z-10">
          <div className="text-center space-y-2">
            {/* Mobile-only logo */}
            <div className="mx-auto lg:hidden flex justify-center mb-4">
              <BrandLogo className="h-12 w-12 shadow-sm" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your account credentials
            </p>
          </div>

          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-background/40 border-border rounded-2xl py-5 focus-visible:ring-primary"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</Label>
                  <Link href="/reset-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-background/40 border-border rounded-2xl py-5 pr-10 focus-visible:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Link to Signup */}
            <div className="text-center mt-6 text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:underline font-bold">
                Sign up
              </Link>
            </div>
          </Card>
        </div>
      </div>
      
    </div>
  )
}
