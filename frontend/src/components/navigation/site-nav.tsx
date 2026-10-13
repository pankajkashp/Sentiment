"use client";

import Link from "next/link";
import { House, FileText, Landmark, BookOpen, Info } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/#feed", label: "Updates", icon: FileText },
  { href: "/#schemes", label: "Schemes", icon: Landmark },
  { href: "/#documents", label: "Documents", icon: BookOpen },
  { href: "/about", label: "About", icon: Info }
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
            className="flex min-h-11 flex-col items-center justify-center gap-1 text-[10px]"
            style={{ color: active ? "var(--accent)" : "var(--muted)" }}
          >
            <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
            <span className={active ? "font-semibold" : ""}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
