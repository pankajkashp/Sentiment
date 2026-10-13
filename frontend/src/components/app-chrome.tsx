"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { SiteNav } from "@/components/navigation/site-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function InnerChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isRestrictedRoute = pathname.startsWith("/admin");
  const showCompactHeader = pathname !== "/" && !isAuthRoute && !isRestrictedRoute;
  return (
    <>
      {showCompactHeader && (
        <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{borderColor:"var(--line)",background:"color-mix(in srgb, var(--paper) 90%, transparent)"}}>
          <div className="content-width flex h-[66px] items-center justify-between gap-3">
            <Wordmark/>
            <div className="flex items-center gap-2">
              <ThemeToggle/>
              <a href="/login" className="rounded-full px-4 py-2.5 text-[11px] font-semibold" style={{background:"var(--accent)",color:"var(--surface)"}}>Sign in</a>
            </div>
          </div>
        </header>
      )}
      {children}
      {!isAuthRoute && !isRestrictedRoute && <SiteNav/>}
    </>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  return <ThemeProvider><InnerChrome>{children}</InnerChrome></ThemeProvider>;
}
