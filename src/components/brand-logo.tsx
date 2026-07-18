import * as React from "react"

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = "h-9 w-9" }: BrandLogoProps) {
  return (
    <svg 
      className={className}
      viewBox="0 0 512 512" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="warmGradLogo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB86B" />
          <stop offset="100%" stopColor="#FFE082" />
        </linearGradient>
      </defs>

      {/* Rounded Square Card Background */}
      <rect x="32" y="32" width="448" height="448" rx="112" fill="url(#warmGradLogo)" />

      {/* Code symbol tag (</>) */}
      <path d="M190 160 L100 256 L190 352" fill="none" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M322 160 L412 256 L322 352" fill="none" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="280" y1="130" x2="232" y2="382" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="round"/>

      {/* AI Sparkle in top-right */}
      <path d="M390 85 C390 115 400 125 430 125 C400 125 390 135 390 165 C390 135 380 125 350 125 C380 125 390 115 390 85 Z" fill="#FFFFFF" />
      <path d="M435 60 C435 72 439 76 451 76 C439 76 435 80 435 92 C435 80 431 76 419 76 C431 76 435 72 435 60 Z" fill="#FF8A65" />
    </svg>
  )
}
