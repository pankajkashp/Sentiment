"use client";

import Link from "next/link";
import { Bookmark, Compass, History, House, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Discover", icon: House },
  { href: "/discover", label: "Explore topics", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/history", label: "Your activity", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound }
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <>
      <nav className="hidden space-y-1 md:block" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] transition-colors"
              style={{ background: active ? "var(--accent-soft)" : "transparent", color: active ? "var(--accent)" : "var(--ink)" }}>
              <Icon size={18} strokeWidth={1.7} />
              <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <nav className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }} aria-label="Mobile navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-label={label}
              className="flex min-h-11 flex-col items-center justify-center gap-1 text-[10px]"
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}>
              <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
