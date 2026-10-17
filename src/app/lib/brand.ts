// App identity, shared by the page metadata, the web app manifest, the UI and
// scripts/generate-icons.mjs. After changing anything here, run `npm run icons`.
// (Keep this file free of imports: the icon script loads it directly with Node.)

export const APP_NAME = "GasMate";
export const APP_TAGLINE = "Track stove time. Split gas fairly.";
export const APP_DESCRIPTION =
  "Time your gas stove use and split the bill fairly with everyone you live with.";

/** Page background. Also the status bar / browser chrome and launch screen colour. */
export const THEME_COLOR = "#0b0d14";

/** Logo size (CSS px) on the launch screen; the in-app splash matches it. */
export const SPLASH_LOGO_SIZE = 112;

/**
 * Portrait iPhone screens that get an iOS launch image, as [width, height,
 * pixel ratio] in CSS px. Without one, an installed app flashes white on launch.
 */
export const APPLE_SPLASH_SCREENS = [
  [440, 956, 3], // 16 Pro Max, 17 Pro Max
  [420, 912, 3], // Air
  [402, 874, 3], // 16 Pro, 17, 17 Pro
  [430, 932, 3], // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12 Pro Max, 13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 12 Pro, 13, 13 Pro, 14, 16e
  [375, 812, 3], // X, XS, 11 Pro, 12 mini, 13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [414, 736, 3], // 6/7/8 Plus
  [375, 667, 2], // 6/7/8, SE (2nd and 3rd gen)
  [320, 568, 2], // SE (1st gen)
] as const;

export type SplashScreenSize = (typeof APPLE_SPLASH_SCREENS)[number];

export function appleSplashPath([width, height, ratio]: SplashScreenSize) {
  return `/splash/apple-splash-${width * ratio}x${height * ratio}.png`;
}
