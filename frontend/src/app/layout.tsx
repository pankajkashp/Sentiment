import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Public Policy Portal — National Schemes & Policy Updates",
    template: "%s · Public Policy Portal"
  },
  description:
    "Official Indian public policy and welfare schemes repository. Verified information from Government of India ministries, the Press Information Bureau, and national portals.",
  applicationName: "Public Policy Portal",
  icons: {
    icon: [
      { url: "public/favicon.png", type: "image/png" },
      { url: "public/favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  },
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#143454",
  colorScheme: "light dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <body className={openSans.className}>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
