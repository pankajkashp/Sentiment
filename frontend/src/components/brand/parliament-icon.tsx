import type { SVGProps } from "react";

/**
 * An original, compact Parliament-inspired architectural icon.
 * Features a circular rotunda with colonnade pillars, dome, and subtle tricolour detail.
 * Does NOT reproduce any official government emblem or imply state affiliation.
 */
export function ParliamentIcon({
  size = 20,
  className = "",
  ...props
}: { size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Central dome with subtle fill */}
      <path
        d="M7 10C7 7.24 9.24 5 12 5C14.76 5 17 7.24 17 10H7Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Finial / Spire */}
      <line x1="12" y1="2.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Entablature roof beam */}
      <line x1="4.5" y1="10" x2="19.5" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      
      {/* Colonnade columns */}
      <line x1="6.5" y1="10" x2="6.5" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9.25" y1="10" x2="9.25" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="10" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.75" y1="10" x2="14.75" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="10" x2="17.5" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Stepped plinth foundation */}
      <line x1="4" y1="17.5" x2="20" y2="17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.5" y1="20" x2="21.5" y2="20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
