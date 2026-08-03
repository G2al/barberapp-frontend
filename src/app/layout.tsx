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
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Lama" },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", themeColor: "#0b0b0a" };

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
