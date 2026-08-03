import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Lama Barber App", template: "%s · Lama" },
  description: "Prenota da Lama, scopri i prodotti e porta sempre con te la tua fidelity card.",
  applicationName: "Lama Barber App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lama",
    startupImage: [
      { url: "/apple-splash/iphone-5.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/apple-splash/iphone-se.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/apple-splash/iphone-8-plus.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-x.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-xr.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/apple-splash/iphone-12.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-14-pro.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-16-pro.png", media: "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-13-pro-max.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-14-pro-max.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/apple-splash/iphone-16-pro-max.png", media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" },
    ],
  },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", interactiveWidget: "resizes-visual", themeColor: "#0b0b0a" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full"><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
