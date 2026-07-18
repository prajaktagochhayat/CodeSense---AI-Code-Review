"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Settings, User, LogOut, ShieldCheck, Heart } from "lucide-react"

const AVATARS = [
  { key: "avatar-1", emoji: "🦊", name: "Tech Fox" },
  { key: "avatar-2", emoji: "🐼", name: "Code Panda" },
  { key: "avatar-3", emoji: "🐨", name: "Dev Koala" },
  { key: "avatar-4", emoji: "🦁", name: "Tech Lion" },
  { key: "avatar-5", emoji: "🐱", name: "Coder Cat" },
  { key: "avatar-6", emoji: "🦄", name: "Git Unicorn" },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  
  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // If no user is logged in and we are in mock mode, populate with mock values
          const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co" || !process.env.NEXT_PUBLIC_SUPABASE_URL
          if (isMock) {
            setUserId("mock-user")
            setEmail("developer@codesense.ai")
            setName("Prajakta Gockhayat")
            setSelectedAvatar("avatar-1")
            setLoading(false)
            return
          }
          router.push("/login")
          return
        }

        setUserId(user.id)
        setEmail(user.email || "")

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profile) {
          setName(profile.name || "")
          setSelectedAvatar(profile.avatar_url || "")
        } else {
          setName(user.user_metadata?.name || "Developer")
          setSelectedAvatar("")
        }
      } catch (err) {
        console.error("Failed to load profile settings:", err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name field cannot be empty")
      return
    }

    setSaving(true)

    try {
      if (userId === "mock-user") {
        toast.success("Settings saved successfully (Mock Mode)!")
        router.refresh()
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          name,
          email,
          avatar_url: selectedAvatar,
        })

      if (error) throw error

      toast.success("Profile settings updated successfully!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      if (userId === "mock-user") {
        toast.success("Signed out successfully")
        router.push("/login")
        router.refresh()
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success("Signed out successfully")
      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out")
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7 text-accent" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Manage your account profile, change your display name, choose a cartoon avatar, and sign out.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-5">
            <CardTitle className="text-md font-extrabold flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              Edit Profile
            </CardTitle>
            <CardDescription className="text-xs">Update your display information and personal avatar</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Email Address - Readonly */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
              <Input
                value={email}
                disabled
                className="bg-muted/40 border-border rounded-2xl py-5 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground">Your account email address is linked via Google login.</p>
            </div>

            {/* Display Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prajakta Gockhayat"
                className="bg-background/40 border-border rounded-2xl py-5"
                required
              />
            </div>

            {/* Cartoon Avatar Selector grid */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Choose Cartoon Avatar</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.key}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.key)}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${
                      selectedAvatar === avatar.key
                        ? "bg-primary/20 border-accent scale-105 shadow-md shadow-primary/10"
                        : "bg-background/25 border-border hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-2xl select-none">{avatar.emoji}</span>
                    <span className="text-[9px] text-muted-foreground mt-1.5 font-bold uppercase">{avatar.name.split(" ")[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center gap-4 border-t border-border/40 py-5 bg-muted/10 rounded-b-3xl">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-[#FF8A65] hover:bg-[#FF8A65]/10 hover:text-[#FF8A65] font-bold px-5 py-5 rounded-2xl transition duration-300 flex items-center gap-2"
            >
              {signingOut ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <LogOut className="h-4.5 w-4.5" />
              )}
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Settings Info Card */}
      <Card className="border-border bg-[#FFE082]/10 border border-[#FFE082]/20 rounded-3xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5.5 w-5.5 text-accent mt-0.5 flex-shrink-0" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Secure Account Protection
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your profile data, settings, display name, and custom selected avatar are encrypted and securely saved to your account, keeping your workspace synchronized.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
