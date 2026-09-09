import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const splashBackground = { r: 11, g: 11, b: 10, alpha: 1 };
const iconBackground = { r: 255, g: 255, b: 255, alpha: 1 };
const splashSource = path.resolve("public/logo-mottola-white.png");
const iconSource = path.resolve("public/logo-mottola-dark.png");
const destination = path.resolve("public/apple-splash");
const publicIcon = path.resolve("public/mottola-icon.png");
const appIcon = path.resolve("src/app/icon.png");
const appleIcon = path.resolve("src/app/apple-icon.png");

const screens = [
  ["iphone-5", 640, 1136],
  ["iphone-se", 750, 1334],
  ["iphone-8-plus", 1242, 2208],
  ["iphone-x", 1125, 2436],
  ["iphone-xr", 828, 1792],
  ["iphone-12", 1170, 2532],
  ["iphone-14-pro", 1179, 2556],
  ["iphone-16-pro", 1206, 2622],
  ["iphone-13-pro-max", 1284, 2778],
  ["iphone-14-pro-max", 1290, 2796],
  ["iphone-16-pro-max", 1320, 2868],
];

await mkdir(destination, { recursive: true });
const trimmedSplashLogo = await sharp(splashSource).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const trimmedIconLogo = await sharp(iconSource).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

for (const [name, width, height] of screens) {
  const logoWidth = Math.round(width * 0.52);
  const logo = await sharp(trimmedSplashLogo).resize({ width: logoWidth, withoutEnlargement: false }).png().toBuffer();
  const { height: logoHeight = 0 } = await sharp(logo).metadata();
  const left = Math.round((width - logoWidth) / 2);
  const top = Math.round(height * 0.42 - logoHeight / 2);

  await sharp({ create: { width, height, channels: 4, background: splashBackground } })
    .composite([{ input: logo, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(destination, `${name}.png`));
}

const iconSize = 512;
const iconLogoWidth = 350;
const iconLogo = await sharp(trimmedIconLogo).resize({ width: iconLogoWidth, withoutEnlargement: false }).png().toBuffer();
const { height: iconLogoHeight = 0 } = await sharp(iconLogo).metadata();
const icon = await sharp({ create: { width: iconSize, height: iconSize, channels: 4, background: iconBackground } })
  .composite([{ input: iconLogo, left: Math.round((iconSize - iconLogoWidth) / 2), top: Math.round((iconSize - iconLogoHeight) / 2) }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

await Promise.all([writeFile(publicIcon, icon), writeFile(appIcon, icon), writeFile(appleIcon, icon)]);
console.log(`Generated ${screens.length} iOS launch screens and Mottolas Family app icons`);
