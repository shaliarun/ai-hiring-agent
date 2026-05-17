interface LogoProps {
  size?: "sm" | "md" | "lg";
}

function InsightlyIcon({ size }: { size: number }) {
  return (
    <img
      src="/insightly-icon.png"
      alt="Insightly icon"
      width={size}
      height={size}
      style={{ borderRadius: "30%", display: "block", flexShrink: 0 }}
    />
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
