"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Sparkles, Terminal, ShieldAlert, Cpu } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)

    // Bypass checking for mock envs
    const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co" || !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isMock) {
      toast.success("Welcome back (Mock Mode Enabled)!")
      router.push("/dashboard")
      router.refresh()
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize Google Authentication")
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

      {/* Right Panel: Glassmorphism auth panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2 bg-background relative">
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-secondary/15 blur-[90px] animate-blob-3" />
        
        <div className="w-full max-w-md space-y-8 z-10">
          <div className="text-center space-y-2">
            {/* Mobile-only logo */}
            <div className="mx-auto lg:hidden flex justify-center mb-4">
              <BrandLogo className="h-12 w-12 shadow-sm" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your account to access your dashboard
            </p>
          </div>

          <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardDescription className="text-xs text-muted-foreground">
                Google Authentication will automatically link your account securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 rounded-2xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-300"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    {/* Google SVG Icon */}
                    <svg className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
  )
}
