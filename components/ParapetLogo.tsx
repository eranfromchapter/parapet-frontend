export default function ParapetLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PARAPET"
      className={className}
    >
      {/* Shield shape with architectural line motif */}
      <path
        d="M24 4L6 12V26C6 36 14 44 24 44C34 44 42 36 42 26V12L24 4Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Architectural parapet lines */}
      <path d="M14 16H34" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 16V14H18V16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 16V14H26V16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 16V14H34V16" stroke="currentColor" strokeWidth="1.5" />
      {/* Central column */}
      <path d="M24 20V34" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20H28" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 34H28" stroke="currentColor" strokeWidth="1.5" />
      {/* Cross beams */}
      <path d="M18 25H30" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M18 29H30" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
