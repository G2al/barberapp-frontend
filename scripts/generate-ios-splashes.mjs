import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const background = { r: 11, g: 11, b: 10, alpha: 1 };
const source = path.resolve("public/lama-logo-white.png");
const destination = path.resolve("public/apple-splash");

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
const trimmedLogo = await sharp(source).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

for (const [name, width, height] of screens) {
  const logoWidth = Math.round(width * 0.52);
  const logo = await sharp(trimmedLogo).resize({ width: logoWidth, withoutEnlargement: false }).png().toBuffer();
  const { height: logoHeight = 0 } = await sharp(logo).metadata();
  const left = Math.round((width - logoWidth) / 2);
  const top = Math.round(height * 0.42 - logoHeight / 2);

  await sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: logo, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(destination, `${name}.png`));
}

console.log(`Generated ${screens.length} iOS launch screens in ${destination}`);
