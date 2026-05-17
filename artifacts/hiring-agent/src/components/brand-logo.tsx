interface LogoProps {
  size?: "sm" | "md" | "lg";
}

function InsightlyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="insightlyGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B6FE8" />
          <stop offset="100%" stopColor="#5B35C8" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="22" fill="url(#insightlyGrad)" />
      {/* Share / network icon — three nodes connected by lines */}
      {/* Lines connecting the nodes */}
      <line x1="22" y1="15" x2="14" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="15" x2="30" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="27" x2="30" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Three node circles */}
      <circle cx="22" cy="14" r="3.5" fill="white" />
      <circle cx="13" cy="28" r="3.5" fill="white" />
      <circle cx="31" cy="28" r="3.5" fill="white" />
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
