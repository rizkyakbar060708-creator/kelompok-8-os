import type { SVGProps } from "react"

function Illustration({ className = "" }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`block w-full max-w-[640px] ${className}`}
      viewBox="0 0 640 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      aria-label="Ilustrasi mahasiswa menyampaikan keluhan melalui platform kampus digital"
    >
      <defs>
        <linearGradient
          id="brandGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#7c5cf0" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient
          id="screenGrad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#f3f2f9" stopOpacity="0.9" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={14} />
          <feOffset dx={0} dy={10} result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.16} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background campus hint (soft) */}
      <path
        d="M40 320 Q 140 200 260 320 T 460 320 L 460 420 H 40 Z"
        fill="#e0e7ff"
        opacity="0.5"
      />
      <path
        d="M90 300 L 70 340 L 110 340 Z"
        fill="#a855f7"
        opacity="0.6"
      />
      <path
        d="M130 290 L 150 340 L 170 340 Z"
        fill="#6366f1"
        opacity="0.55"
      />

      {/* Device / tablet showing complaint interface */}
      <g filter="url(#softShadow)">
        <rect x="250" y="130" width="260" height="300" rx="28" fill="url(#screenGrad)" stroke="#cbd5e1" strokeOpacity="0.5" />
        {/* screen header */}
        <rect x="272" y="156" width="216" height="44" rx="8" fill="#f1f5f9" />
        <circle cx="286" cy="178" r="5" fill="#94a3b8" opacity="0.6" />
        <circle cx="300" cy="178" r="5" fill="#94a3b8" opacity="0.6" />
        <circle cx="314" cy="178" r="5" fill="#94a3b8" opacity="0.6" />
        {/* complaint bubble */}
        <path
          d="M282 230 Q 282 216 296 216 L 430 216 Q 444 216 444 230 L 444 300 Q 444 314 430 314 L 296 314 Q 282 314 282 300 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeOpacity="0.6"
        />
        <rect x="296" y="244" width="120" height="10" rx="4" fill="#e2e8f0" />
        <rect x="296" y="260" width="90" height="10" rx="4" fill="#e2e8f0" />
        <rect x="296" y="276" width="70" height="10" rx="4" fill="#e2e8f0" />
        <rect x="366" y="238" width="22" height="22" rx="6" fill="#6366f1" />
        <path d="M372 244 L 378 250 L 384 244" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* status dot */}
        <circle cx="416" cy="222" r="8" fill="#10b981" />
        <circle cx="416" cy="222" r="4" fill="#ffffff" />
      </g>

      {/* Student figure (abstract) */}
      <g filter="url(#softShadow)">
        <circle cx="150" cy="260" r="34" fill="#1e293b" />
        <path
          d="M 116 320 L 116 390 Q 116 410 132 410 L 168 410 Q 184 410 184 390 L 184 320"
          fill="url(#brandGrad)"
        />
        <rect x="124" y="330" width="16" height="28" rx="8" fill="#f1f5f9" />
        <rect x="140" y="330" width="16" height="28" rx="8" fill="#cbd5e1" opacity="0.7" />
        <rect x="156" y="330" width="16" height="28" rx="8" fill="#f1f5f9" />
        <circle cx="150" cy="362" r="6" fill="#fbbf24" opacity="0.9" />
      </g>

      {/* Floating accent dots */}
      <circle cx="520" cy="100" r="12" fill="#a855f7" opacity="0.45" />
      <circle cx="560" cy="160" r="8" fill="#3b82f6" opacity="0.5" />
      <circle cx="480" cy="210" r="10" fill="#f59e0b" opacity="0.45" />
      <circle cx="600" cy="260" r="14" fill="#6366f1" opacity="0.35" />
      <circle cx="70" cy="180" r="10" fill="#22d3ee" opacity="0.4" />
      <circle cx="110" cy="130" r="7" fill="#f472b6" opacity="0.5" />
    </svg>
  )
}

export default Illustration
