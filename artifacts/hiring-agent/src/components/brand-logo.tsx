interface LogoProps {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export function AppLogo({ size = "md", inverted = false }: LogoProps) {
  const imgSize = size === "sm" ? 32 : size === "lg" ? 52 : 42;

  const titleSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  const subtitleSize = size === "sm" ? "text-[9px]" : size === "lg" ? "text-sm" : "text-[11px]";

  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/insightly-logo.png"
        alt="Insightly"
        width={imgSize}
        height={imgSize}
        className="rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col leading-none">
        <span
          className={`font-bold tracking-tight ${titleSize} ${
            inverted ? "text-white" : "text-foreground"
          }`}
        >
          Insightly
        </span>
        <span
          className={`font-semibold uppercase tracking-widest ${subtitleSize} ${
            inverted ? "text-white/60" : "text-muted-foreground"
          }`}
          style={{ color: inverted ? undefined : "#7C6BE0" }}
        >
          Hiring Agent
        </span>
      </div>
    </div>
  );
}
