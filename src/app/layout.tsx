import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeSense — AI Code Review",
  description: "Automated static code analysis and AI-driven feedback for your code.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200 relative overflow-x-hidden font-sans">
        {/* Premium noise texture overlay */}
        <div className="noise-overlay" />
        
        {/* Soft, warm floating blurred pastel blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] opacity-60 dark:opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[130px] animate-blob-1" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/30 blur-[130px] animate-blob-2" />
          <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/15 blur-[110px] animate-blob-3" />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
