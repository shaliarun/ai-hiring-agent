interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function InsightlyMark({ size = "md", className = "" }: BrandLogoProps) {
  const dims = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  return (
    <svg
      width={dims}
      height={dims}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#FF5A1F" />
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="22"
        fill="white"
        letterSpacing="-0.5"
      >
        in
      </text>
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export function AppLogo({ size = "md", inverted = false }: LogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-2.5">
      <InsightlyMark size={size} />
      <span
        className={`font-extrabold tracking-tight leading-none ${textSizes[size]} ${
          inverted ? "text-white" : "text-foreground"
        }`}
        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
      >
        Hiring
        <span className="text-[#FF5A1F]">Agent</span>
      </span>
    </div>
  );
}
