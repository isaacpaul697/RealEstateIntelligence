import { UNIVERSITIES } from "../universities";

/**
 * ESPN CDN athletic logos — verified team IDs for every D1 school in our list.
 * Format: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
 * These return the recognisable athletic / brand mark (e.g. Wisconsin "W"),
 * not the university seal that Wikipedia's pageimages API often serves.
 *
 * Schools without an ESPN ID (D3, very small) fall back to Google favicon.
 */
const ESPN_IDS: Record<string, number> = {
  // ── Midwest ───────────────────────────────────────────────────────────
  iowa: 2294,
  iowastate: 66,
  northwestern: 77,
  illinois: 356,
  indiana: 84,
  purdue: 2509,
  kansas: 2305,
  kstate: 2306,
  michigan: 130,
  michiganstate: 127,
  minnesota: 135,
  // stthomas — new D1, no stable ESPN entry yet
  missouri: 142,
  mostate: 2623,
  northdakota: 155,
  ndsu: 2449,
  nebraska: 158,
  creighton: 156,
  ohiostate: 194,
  cincinnati: 2132,
  sdsu: 2571,
  southdakota: 233,
  wisconsin: 275,
  marquette: 269,

  // ── South ─────────────────────────────────────────────────────────────
  alabama: 333,
  auburn: 2,
  arkansas: 8,
  arkstate: 2032,
  florida: 57,
  fsu: 52,
  usf: 58,
  miami: 2390,
  georgia: 61,
  gatech: 59,
  kentucky: 96,
  louisville: 97,
  lsu: 99,
  tulane: 2655,
  olemiss: 145,
  msstate: 344,
  jacksonstate: 2296,
  unc: 153,
  ncstate: 152,
  oklahoma: 201,
  okstate: 197,
  southcarolina: 2579,
  clemson: 228,
  coastalcarolina: 324,
  tennessee: 2633,
  vanderbilt: 238,
  texas: 251,
  tamu: 245,
  smu: 2567,
  virginia: 258,
  vatech: 259,
  wvu: 277,
  marshall: 276,

  // ── West ───────────────────────────────────────────────────────────────
  // alaskafairbanks — no ESPN entry
  // alaskaanchorage — no ESPN entry
  asu: 9,
  arizona: 12,
  ucla: 26,
  usc: 30,
  berkeley: 25,
  colorado: 38,
  colostate: 36,
  hawaii: 62,
  // hawaiipacific — no ESPN entry
  boisestate: 68,
  idaho: 70,
  montana: 149,
  montanastate: 147,
  newmexico: 167,
  nmsu: 166,
  unlv: 2439,
  nevada: 2440,
  oregon: 2483,
  oregonstate: 204,
  utah: 254,
  byu: 252,
  washington: 264,
  wsu: 265,
  wyoming: 2751,

  // ── Northeast ─────────────────────────────────────────────────────────
  uconn: 41,
  yale: 43,
  delaware: 48,
  delawarestate: 2169,
  bu: 104,
  umass: 113,
  maryland: 120,
  towson: 119,
  maine: 311,
  // usm — D3, no ESPN entry
  newhampshire: 160,
  dartmouth: 159,
  rutgers: 164,
  princeton: 163,
  syracuse: 183,
  buffalo: 2084,
  pennstate: 213,
  pitt: 221,
  uri: 227,
  brown: 225,
  vermont: 261,
  // middlebury — D3, no ESPN entry
};

function espnLogo(id: number): string {
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
}

/**
 * Resolve logos for every campus via ESPN's CDN (athletic marks).
 * Schools without a known ESPN ID get null — markets.ts then falls back
 * to a Google favicon so every school has *something*.
 */
export async function fetchLogos(): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  for (const u of UNIVERSITIES) {
    const eid = ESPN_IDS[u.id];
    out.set(u.id, eid != null ? espnLogo(eid) : null);
  }
  return out;
}
