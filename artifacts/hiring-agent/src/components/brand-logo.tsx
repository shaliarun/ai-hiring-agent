interface LogoProps {
  size?: "sm" | "md" | "lg";
}

function InsightlyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ig" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="56" height="56" rx="14" fill="url(#ig)" />

      {/* ── Shuffle icon ── */}
      {/* Top path: top-left → curves → bottom-right */}
      <path
        d="M 13,20 C 22,20 30,36 39,36"
        stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round"
      />
      {/* Arrowhead on top path (pointing right at bottom-right end) */}
      <polyline
        points="35,31 39,36 34,38"
        stroke="white" strokeWidth="2.6" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Bottom path: bottom-left → curves → top-right */}
      <path
        d="M 13,36 C 22,36 30,20 39,20"
        stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round"
      />
      {/* Arrowhead on bottom path (pointing right at top-right end) */}
      <polyline
        points="35,18 39,20 35,25"
        stroke="white" strokeWidth="2.6" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Small fork dots at the left start */}
      <circle cx="13" cy="20" r="2.2" fill="white" />
      <circle cx="13" cy="36" r="2.2" fill="white" />
    </svg>
  );
}

export function AppLogo({ size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? 34 : size === "lg" ? 50 : 42;
  const titleCls = size === "sm" ? "text-[15px]" : size === "lg" ? "text-2xl" : "text-xl";
  const subtitleCls = size === "sm" ? "text-[9px]" : size === "lg" ? "text-[13px]" : "text-[11px]";

  return (
    <div className="flex items-center gap-2.5">
      <InsightlyIcon size={iconSize} />
      <div className="flex flex-col leading-tight">
        <span
          className={`font-bold tracking-tight text-white ${titleCls}`}
          style={{ textShadow: "none" }}
        >
          Insightly
        </span>
        <span
          className={`font-semibold uppercase tracking-widest ${subtitleCls}`}
          style={{ color: "#A78BFA", letterSpacing: "0.12em" }}
        >
          Hiring Agent
        </span>
      </div>
    </div>
  );
}
