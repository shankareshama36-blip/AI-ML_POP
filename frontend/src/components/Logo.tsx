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
