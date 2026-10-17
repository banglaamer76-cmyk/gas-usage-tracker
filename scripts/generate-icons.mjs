// Renders every app icon and iOS launch image from the logo definition in
// src/app/lib/logo.ts. Run `npm run icons` after changing the logo or brand.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  APPLE_SPLASH_SCREENS,
  SPLASH_LOGO_SIZE,
  THEME_COLOR,
  appleSplashPath,
} from "../src/app/lib/brand.ts";
import {
  FAVICON_FLAME_TRANSFORM,
  FLAME_CORE_PATH,
  FLAME_PATH,
  LOGO_COLORS,
  LOGO_CORNER_RADIUS,
  STOPWATCH,
} from "../src/app/lib/logo.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const c = LOGO_COLORS;

const defs = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.backgroundFrom}"/><stop offset="1" stop-color="${c.backgroundTo}"/></linearGradient>
  <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.flameFrom}"/><stop offset="1" stop-color="${c.flameTo}"/></linearGradient>
  <linearGradient id="core" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.coreFrom}"/><stop offset="1" stop-color="${c.coreTo}"/></linearGradient>
</defs>`;

const flame = (transform) =>
  `<g transform="${transform}"><path d="${FLAME_PATH}" fill="url(#flame)"/><path d="${FLAME_CORE_PATH}" fill="url(#core)"/></g>`;

const { crown, stem, ring, arc, flameTransform } = STOPWATCH;
const stopwatch = `
  <rect x="${crown.x}" y="${crown.y}" width="${crown.width}" height="${crown.height}" rx="${crown.rx}" fill="${c.glyph}"/>
  <rect x="${stem.x}" y="${stem.y}" width="${stem.width}" height="${stem.height}" fill="${c.glyph}"/>
  <circle cx="${ring.cx}" cy="${ring.cy}" r="${ring.r}" fill="none" stroke="${c.glyph}" stroke-opacity=".3" stroke-width="${ring.strokeWidth}"/>
  <path d="${arc}" fill="none" stroke="${c.glyph}" stroke-width="${ring.strokeWidth}" stroke-linecap="round"/>
  ${flame(flameTransform)}`;

/**
 * The logo as an SVG document.
 * `radius` rounds the background (0 = full-bleed square, for platforms that mask icons).
 * `simple` drops the stopwatch, for favicons where it would blur.
 */
function logoSvg({ radius = 0, simple = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}<rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>${simple ? flame(FAVICON_FLAME_TRANSFORM) : stopwatch}</svg>`;
}

/** `opaque` drops the alpha channel, for full-bleed icons that have no transparent pixels. */
const png = (svg, size, { opaque = false } = {}) => {
  const image = sharp(Buffer.from(svg)).resize(size, size);
  return (opaque ? image.removeAlpha() : image).png({ compressionLevel: 9 }).toBuffer();
};

/** Packs PNG images into a .ico file (PNG-compressed entries, supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;
  images.forEach(({ size, data }, i) => {
    const entry = i * 16;
    directory.writeUInt8(size % 256, entry); // 0 means 256
    directory.writeUInt8(size % 256, entry + 1);
    directory.writeUInt16LE(1, entry + 4); // colour planes
    directory.writeUInt16LE(32, entry + 6); // bits per pixel
    directory.writeUInt32LE(data.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
}

async function write(relativePath, data) {
  const file = path.join(root, relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  console.log(`  ${relativePath}`);
}

const rounded = logoSvg({ radius: LOGO_CORNER_RADIUS });
const fullBleed = logoSvg();
const favicon = logoSvg({ radius: LOGO_CORNER_RADIUS, simple: true });

console.log("Browser icons");
await write("src/app/icon.svg", favicon);
await write(
  "src/app/favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(favicon, size) }))))
);
// iOS rounds the corners itself and fills transparency with black, so no rounding here.
await write("src/app/apple-icon.png", await png(fullBleed, 180, { opaque: true }));

console.log("Web app manifest icons");
for (const size of [192, 512]) {
  await write(`public/icons/icon-${size}.png`, await png(rounded, size));
  // Maskable: Android crops these to its own shape; the logo sits inside the 80% safe zone.
  await write(`public/icons/maskable-${size}.png`, await png(fullBleed, size, { opaque: true }));
}

console.log("iOS launch images");
for (const screen of APPLE_SPLASH_SCREENS) {
  const [width, height, ratio] = screen;
  const canvas = { width: width * ratio, height: height * ratio };
  const logoSize = SPLASH_LOGO_SIZE * ratio;
  const image = await sharp({ create: { ...canvas, channels: 3, background: THEME_COLOR } })
    .composite([
      {
        input: await png(rounded, logoSize),
        left: Math.round((canvas.width - logoSize) / 2),
        top: Math.round((canvas.height - logoSize) / 2),
      },
    ])
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  await write(path.join("public", appleSplashPath(screen)), image);
}
