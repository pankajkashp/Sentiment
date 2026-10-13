import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";

export const metadata: Metadata = {
  title: {
    default: "Public Policy Portal — National Schemes & Policy Updates",
    template: "%s · Public Policy Portal"
  },
  description:
    "Official Indian public policy and welfare schemes repository. Verified information from Government of India ministries, the Press Information Bureau, and national portals.",
  applicationName: "Public Policy Portal",
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
