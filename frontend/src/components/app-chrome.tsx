"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GovHeader } from "@/components/navigation/gov-header";
import { SiteNav } from "@/components/navigation/site-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";

import { IndianFlagBackground } from "@/components/brand/indian-flag-background";

function InnerChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isRestrictedRoute = pathname.startsWith("/admin");
  const isHome = pathname === "/";

  return (
    <>
      {!isHome && !isAuthRoute && !isRestrictedRoute && <GovHeader />}
      {children}
      {!isAuthRoute && !isRestrictedRoute && <SiteNav />}
    </>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <IndianFlagBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <InnerChrome>{children}</InnerChrome>
      </div>
    </ThemeProvider>
  );
}
