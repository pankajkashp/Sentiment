"use client";

import Link from "next/link";
import { House, History, Bookmark, Compass, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/history", label: "History", icon: History },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/discover", label: "Explore", icon: Compass },
  { href: "/profile", label: "Profile", icon: UserRound }
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      aria-label="Mobile bottom navigation"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="flex min-h-11 flex-col items-center justify-center gap-1 text-[11px]"
            style={{ color: active ? "var(--accent)" : "var(--muted)" }}
          >
            <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
            <span className={active ? "font-bold text-[#E87518]" : "font-medium"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
