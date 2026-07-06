"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    })

    setLoading(false)
    if (error) {
      toast.error(error.message || "Failed to send reset link")
      return
    }

    toast.success("Password reset link sent to your email!")
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-primary)/10,_transparent_50%)] px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:bg-card/75">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight mt-4">Reset your password</CardTitle>
          <CardDescription>
            {submitted 
              ? "Check your inbox for further instructions" 
              : "Enter your email address to receive a recovery link"}
          </CardDescription>
        </CardHeader>
        {!submitted ? (
          <form onSubmit={handleResetRequest}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-background/50 border-border focus-visible:ring-primary"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 rounded-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-6">
              We have sent a password reset link to <strong className="text-foreground">{email}</strong>.
              Please check your email and click the link to configure a new password.
            </p>
            <Link href="/login">
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
