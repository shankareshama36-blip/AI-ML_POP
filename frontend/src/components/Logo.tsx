interface LogoProps {
  className?: string;
  showDot?: boolean;
}

export function Logo({ className = "", showDot = true }: LogoProps) {
  return (
    <span className={`praxis-logo ${className}`.trim()}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 6L16 16M24 6L16 16M16 4V16" stroke="#9ba1ae" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 16L24 26" stroke="#5b8def" strokeWidth="3" strokeLinecap="round" />
        <circle cx="8" cy="6" r="2" fill="#9ba1ae" />
        <circle cx="16" cy="4" r="2" fill="#9ba1ae" />
        <circle cx="24" cy="6" r="2" fill="#9ba1ae" />
        <circle cx="16" cy="16" r="3" fill="#f4f5f7" />
        <circle cx="24" cy="26" r="3.5" fill="#34d399" />
      </svg>
      <span className="praxis-logo-wordmark">
        Praxis{showDot && <span className="praxis-dot" aria-hidden="true" />}
      </span>
    </span>
  );
}

export function AILogo({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ai-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5b8def" />
          <stop offset="1" stopColor="#8a2be2" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="url(#ai-grad)"
      />
    </svg>
  );
}

