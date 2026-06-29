"use client";

/**
 * Real Estate Intelligence master mark: two white line-art towers, a tall
 * pointed skyscraper beside a shorter angled-top building, standing on a
 * baseline. White stroke on the gold gradient tile.
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-grid place-items-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(150deg, var(--gold-bright), var(--gold-deep))",
        boxShadow: "0 1px 3px rgba(0,0,0,.12)",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        stroke="white"
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* tall pointed tower (left): left wall, slanted roof to the apex, right wall */}
        <path d="M30 91 V36 L55 13 V91" />
        {/* inner column of the tall tower */}
        <path d="M42 91 V43" />
        {/* shorter angled-top building (right) */}
        <path d="M61 91 V50 L80 35 V91" />
        {/* inner column of the right building */}
        <path d="M70 91 V55" />
        {/* shared baseline */}
        <path d="M22 91 H84" strokeWidth={6} />
      </svg>
    </span>
  );
}
