export function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "n/a";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function fmtCompactUSD(n: number | null | undefined): string {
  if (n == null) return "n/a";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "n/a";
  return Math.round(n).toLocaleString("en-US");
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "n/a";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "n/a";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDuration(days: number | null | undefined): string {
  if (days == null) return "n/a";
  if (days < 90) return `${Math.round(days)} days`;
  return `${(days / 30.44).toFixed(0)} mo`;
}

/** URL-safe encode of a development id (city:permitNumber may contain spaces/slashes). */
export function encodeId(id: string): string {
  return encodeURIComponent(Buffer.from(id, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
}

export function decodeId(token: string): string {
  const b64 = decodeURIComponent(token).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}
