import { useId } from "react";
import { APP_NAME } from "@/app/lib/brand";
import { cx } from "@/app/lib/cx";
import {
  FLAME_CORE_PATH,
  FLAME_PATH,
  LOGO_COLORS as colors,
  LOGO_CORNER_RADIUS,
  STOPWATCH,
} from "@/app/lib/logo";

/** SVG ids must be unique per instance and safe inside url(#…). */
const useSvgId = () => useId().replace(/[^\w-]/g, "");

/** The app icon, drawn inline from the same geometry as the generated PNG icons. */
export function AppMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useSvgId();
  const { crown, stem, ring, arc, flameTransform } = STOPWATCH;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cx("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.backgroundFrom} />
          <stop offset="1" stopColor={colors.backgroundTo} />
        </linearGradient>
        <linearGradient id={`${id}flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.flameFrom} />
          <stop offset="1" stopColor={colors.flameTo} />
        </linearGradient>
        <linearGradient id={`${id}core`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.coreFrom} />
          <stop offset="1" stopColor={colors.coreTo} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx={LOGO_CORNER_RADIUS} fill={`url(#${id}bg)`} />
      <rect {...crown} fill={colors.glyph} />
      <rect {...stem} fill={colors.glyph} />
      <circle
        cx={ring.cx}
        cy={ring.cy}
        r={ring.r}
        fill="none"
        stroke={colors.glyph}
        strokeOpacity={0.3}
        strokeWidth={ring.strokeWidth}
      />
      <path d={arc} fill="none" stroke={colors.glyph} strokeWidth={ring.strokeWidth} strokeLinecap="round" />
      <g transform={flameTransform}>
        <path d={FLAME_PATH} fill={`url(#${id}flame)`} />
        <path d={FLAME_CORE_PATH} fill={`url(#${id}core)`} />
      </g>
    </svg>
  );
}

/** "GasMate", with the second word in the brand colour. */
export function Wordmark({ className }: { className?: string }) {
  const match = /^([A-Z][a-z]+)(.+)$/.exec(APP_NAME);
  const [first, rest] = match ? [match[1], match[2]] : [APP_NAME, ""];
  return (
    <span className={cx("font-display font-extrabold tracking-tight text-ink", className)}>
      {first}
      <span className="text-brand">{rest}</span>
    </span>
  );
}

/** The timer's flame: grey while idle, lit and flickering while a session runs. */
export function Flame({ lit, className }: { lit: boolean; className?: string }) {
  const id = useSvgId();
  const litStyle = { opacity: lit ? 1 : 0 };
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}hot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={`${id}core`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <g className={cx(lit && "animate-flicker")} style={{ transformOrigin: "50% 96%" }}>
        <path d={FLAME_PATH} fill="#334155" />
        <path d={FLAME_PATH} fill={`url(#${id}hot)`} className="transition-opacity duration-500" style={litStyle} />
        <path d={FLAME_CORE_PATH} fill="#475569" />
        <path d={FLAME_CORE_PATH} fill={`url(#${id}core)`} className="transition-opacity duration-500" style={litStyle} />
      </g>
    </svg>
  );
}
