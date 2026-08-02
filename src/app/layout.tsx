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
  title: { default: "BarberApp", template: "%s · BarberApp" },
  description: "Prenota il tuo appuntamento dal barbiere in pochi tocchi.",
  applicationName: "BarberApp",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BarberApp" },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b0b0b" };

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
