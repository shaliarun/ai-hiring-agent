interface LogoProps {
  size?: "sm" | "md" | "lg";
}

function InsightlyIcon({ size }: { size: number }) {
  const iconScale = size / 36;
  const innerSize = Math.round(size * 0.44);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.42),
        background: "linear-gradient(135deg, #a78bfa 0%, #6366f1 50%, #9333ea 100%)",
        boxShadow: "0 4px 14px 0 rgba(99,102,241,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={innerSize}
        height={innerSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
        <path d="M20 2v4" />
        <path d="M22 4h-4" />
        <circle cx="4" cy="20" r="2" />
      </svg>
    </div>
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
