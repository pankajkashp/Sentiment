"use client";

import Link from "next/link";
import { StambhIcon } from "./stambh-icon";

interface PortalIdentityProps {
  compact?: boolean;
  className?: string;
}

export function PortalIdentity({ compact = false, className = "" }: PortalIdentityProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 group text-left ${className}`}
      aria-label="Public Policy Portal home"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white shadow-xs p-1">
        <StambhIcon size={34} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold tracking-wide text-[#444444] font-hindi">
          सार्वजनिक नीति पोर्टल
        </span>
        <span className="font-display text-[17px] sm:text-[19px] font-extrabold tracking-tight text-[#171717]">
          PUBLIC POLICY PORTAL
        </span>
        {!compact && (
          <span className="text-[10px] font-medium text-[#666666] tracking-normal">
            National Schemes &amp; Policy Updates Repository
          </span>
        )}
      </div>
    </Link>
  );
}
