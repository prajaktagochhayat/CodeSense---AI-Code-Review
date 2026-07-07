import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch optional profile metadata including avatar_url
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const sidebarUser = {
    email: user.email || "",
    name: profile?.name || user.user_metadata?.name || "Developer",
    avatar_url: profile?.avatar_url || "",
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background">
      <DashboardSidebar user={sidebarUser} />
      <main className="flex-1 overflow-y-auto md:pl-64 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
