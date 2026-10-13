"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GovHeader } from "@/components/navigation/gov-header";
import { SiteNav } from "@/components/navigation/site-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";

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
      <InnerChrome>{children}</InnerChrome>
    </ThemeProvider>
  );
}
