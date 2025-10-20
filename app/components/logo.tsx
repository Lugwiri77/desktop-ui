import React from 'react'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kastaem Logo"
    >
      {/* Icon - Modern K symbol */}
      <path
        d="M5 8L5 32M5 20L18 8M5 20L18 32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Text - KASTAEM */}
      <text
        x="30"
        y="28"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="currentColor"
        letterSpacing="-0.02em"
      >
        KASTAEM
      </text>
    </svg>
  )
}
