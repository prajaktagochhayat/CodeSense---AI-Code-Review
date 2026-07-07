"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"
import {
  LayoutDashboard,
  PlusCircle,
  Moon,
  Sun,
  Menu,
  X,
  User
} from "lucide-react"

interface SidebarProps {
  user: {
    email?: string
    name?: string
    avatar_url?: string
  }
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/new",
      label: "New Review",
      icon: PlusCircle,
      active: pathname === "/dashboard/new" || pathname.startsWith("/dashboard/new/"),
    },
  ]

  const getAvatarEmoji = (url?: string) => {
    switch (url) {
      case "avatar-1": return "🦊"
      case "avatar-2": return "🐼"
      case "avatar-3": return "🐨"
      case "avatar-4": return "🦁"
      case "avatar-5": return "🐱"
      case "avatar-6": return "🦄"
      default: return null
    }
  }

  const emoji = getAvatarEmoji(user.avatar_url)

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between text-foreground px-2 py-6">
      <div className="space-y-8">
        
        {/* Brand Logo & Name */}
        <Link href="/dashboard" className="flex items-center gap-3 px-3 transition hover:opacity-90">
          <BrandLogo className="h-9 w-9 shadow-sm" />
          <span className="text-lg font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            CodeSense
          </span>
        </Link>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
            Navigation
          </span>
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  link.active
                    ? "bg-gradient-to-r from-primary/15 to-secondary/10 border-l-2 border-accent text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition ${
                  link.active ? "bg-primary/20 text-accent" : "bg-muted/40 text-muted-foreground"
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Profile & Configuration controls */}
      <div className="space-y-5 pt-4 border-t border-border/50">
        
        {/* Modern light/dark mode switcher */}
        {mounted && (
          <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-1 border border-border/20">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex justify-center py-2 rounded-xl transition-all duration-300 ${
                theme === "light"
                  ? "bg-background text-foreground shadow-xs border border-border/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Light Mode"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex justify-center py-2 rounded-xl transition-all duration-300 ${
                theme === "dark"
                  ? "bg-background text-foreground shadow-xs border border-border/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Dark Mode"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* User Profile - direct navigation Link to settings page */}
        <Link 
          href="/dashboard/settings" 
          onClick={() => setIsOpen(false)}
          className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-primary/5 transition duration-300 cursor-pointer border ${
            pathname === "/dashboard/settings"
              ? "border-border/80 bg-gradient-to-r from-primary/10 to-transparent"
              : "border-transparent hover:border-border/30"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-accent flex-shrink-0 border border-primary/10">
            {emoji ? (
              <span className="text-base select-none">{emoji}</span>
            ) : (
              <User className="h-5 w-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-bold text-foreground">
              {user?.name || "Developer"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {user?.email || ""}
            </p>
          </div>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Floating Sidebar container */}
      <aside className="fixed top-4 left-4 bottom-4 w-60 rounded-3xl glass-panel z-40 hidden md:flex flex-col shadow-xl transition-all duration-300 hover:shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sticky Navbar Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card/65 backdrop-blur-md px-4 md:hidden z-30 sticky top-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandLogo className="h-8 w-8 shadow-xs" />
          <span className="text-sm font-bold tracking-tight text-foreground">CodeSense</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 w-9 rounded-xl border border-border"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Slide-out Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <nav className="relative flex w-64 max-w-sm flex-col bg-card border-r border-border h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </nav>
        </div>
      )}
    </>
  )
}
