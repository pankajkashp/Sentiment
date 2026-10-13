import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";

export const metadata: Metadata = {
  title: { default: "PolicyLens — Public issues, seen clearly", template: "%s · PolicyLens" },
  description: "Explore public policy discussions, understand different perspectives, and follow the evidence behind collective insights.",
  applicationName: "PolicyLens",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f4",
  colorScheme: "light dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><AppChrome>{children}</AppChrome></body>
    </html>
  );
}
