interface LogoProps {
  size?: "sm" | "md" | "lg";
}

function InsightlyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="insightlyGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9B7FEA" />
          <stop offset="100%" stopColor="#6B3FD4" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="22" fill="url(#insightlyGrad)" />
      {/* Sparkle / asterisk icon */}
      <g stroke="white" strokeWidth="2.2" strokeLinecap="round">
        <line x1="22" y1="11" x2="22" y2="33" />
        <line x1="11" y1="22" x2="33" y2="22" />
        <line x1="14.5" y1="14.5" x2="29.5" y2="29.5" />
        <line x1="29.5" y1="14.5" x2="14.5" y2="29.5" />
      </g>
      <circle cx="22" cy="22" r="3" fill="white" />
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
