import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engineering Command Center",
  description: "An interactive engineering portfolio built as a software system.",
};

export const viewport: Viewport = {
  // Deliberately no `userScalable: false` / `maximumScale: 1` — suppressing
  // zoom fails WCAG 1.4.4, and this app is fixed-viewport by layout, not by
  // taking zoom away from the user.
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  // Must match `--void` in globals.css, which is true #000 — a tinted value
  // here shows as a lighter band behind mobile browser chrome.
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
