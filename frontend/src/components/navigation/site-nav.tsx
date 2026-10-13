"use client";

import Link from "next/link";
import { Bookmark, Compass, History, House, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Consultations", icon: House },
  { href: "/discover", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/history", label: "Activity", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden"
        style={{
          borderColor: "var(--line)",
          background: "var(--surface)",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.04)",
        }}
        aria-label="Mobile navigation"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex min-h-[44px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors"
              style={{
                color: active ? "var(--saffron)" : "var(--muted)",
              }}
            >
              <span className="relative">
                <Icon size={18} strokeWidth={active ? 2.2 : 1.75} aria-hidden="true" />
                {active && (
                  <span
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: "var(--saffron)" }}
                    aria-hidden="true"
                  />
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
