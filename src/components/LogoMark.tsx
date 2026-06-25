"use client";

/**
 * Campus Capital logo mark - a graduation cap (mortarboard),
 * the universal academic symbol. Clean white on gold gradient.
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-grid place-items-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: "linear-gradient(150deg, var(--gold-bright), var(--gold-deep))",
        boxShadow: "0 1px 3px rgba(0,0,0,.12)",
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mortarboard - flat diamond board */}
        <path d="M16 7L3 14l13 7 13-7L16 7Z" fill="white" />
        {/* Cap base / band */}
        <path d="M8 16v5c0 1.8 3.6 3.5 8 3.5s8-1.7 8-3.5v-5l-8 4.3L8 16Z" fill="white" fillOpacity={0.85} />
        {/* Tassel string from center */}
        <line x1="16" y1="12" x2="16" y2="16" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M16 16c0 2-4 3.5-4.5 6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        {/* Tassel end */}
        <circle cx="11.5" cy="22.5" r="1" fill="white" fillOpacity={0.9} />
      </svg>
    </span>
  );
}
