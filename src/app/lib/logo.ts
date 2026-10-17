// The GasMate logo: a flame inside a stopwatch, on a 512×512 artboard.
// Shared by <AppMark/> and scripts/generate-icons.mjs so every icon matches.
// (Keep this file free of imports: the icon script loads it directly with Node.)

export const LOGO_COLORS = {
  backgroundFrom: "#FFA24C",
  backgroundTo: "#EA580C",
  glyph: "#FFFFFF",
  flameFrom: "#FFFFFF",
  flameTo: "#FFF1E2",
  coreFrom: "#FB923C",
  coreTo: "#EA580C",
} as const;

/** Corner radius when the mark is drawn as a rounded square (close to the iOS icon shape). */
export const LOGO_CORNER_RADIUS = 115;

/** Flame outline and its inner core, drawn in a 100×100 box. */
export const FLAME_PATH =
  "M50 96C32.3 96 18 81.7 18 64C18 48 25.5 36.5 33.5 27C35.5 36.5 39.5 43 45.5 46.5C45 30 50.5 15 61 4C73.5 19 82 38.5 82 64C82 81.7 67.7 96 50 96Z";
export const FLAME_CORE_PATH =
  "M50 88C41.2 88 34 80.8 34 72C34 62 41 53 50 44C59 53 66 62 66 72C66 80.8 58.8 88 50 88Z";

/** Stopwatch parts, in artboard units. */
export const STOPWATCH = {
  crown: { x: 226, y: 86, width: 60, height: 30, rx: 12 },
  stem: { x: 244, y: 108, width: 24, height: 24 },
  ring: { cx: 256, cy: 284, r: 148, strokeWidth: 30 },
  /** The bright "elapsed" arc: clockwise from 12 o'clock round to about 10 o'clock. */
  arc: "M256 136A148 148 0 1 1 151.35 179.35",
  flameTransform: "translate(146 180) scale(2.2)",
} as const;

/** Flame-only variant for favicons, where the stopwatch would blur at 16px. */
export const FAVICON_FLAME_TRANSFORM = "translate(86 76) scale(3.4)";
