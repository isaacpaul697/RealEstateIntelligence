"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { BpsStateRow } from "@/lib/dev/types";
import { STATE_CENTROID } from "@/lib/dev/live/bps";
import { CITIES } from "@/lib/dev/cities";
import { fmtNum } from "@/lib/dev/format";

type Hotspot = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  href?: string;
  live: boolean;
  metroUnits: number; // state units shared across the state's tracked metros
  row: BpsStateRow;
};

export default function NationalMapInner({
  states,
  height = 460,
}: {
  states: BpsStateRow[];
  height?: number;
}) {
  const byState = new Map(states.map((s) => [s.state, s]));

  // Group tracked cities by state so each state's permit volume is anchored on
  // the real metros we cover, rather than floating at the geographic centroid.
  const citiesByState = new Map<string, typeof CITIES>();
  for (const c of CITIES) {
    (citiesByState.get(c.state) ?? citiesByState.set(c.state, []).get(c.state)!).push(c);
  }

  const spots: Hotspot[] = [];
  for (const [state, row] of byState) {
    const cities = citiesByState.get(state);
    if (cities && cities.length) {
      const share = row.totalUnits / cities.length;
      for (const c of cities) {
        spots.push({
          id: c.id,
          name: c.name,
          state,
          lat: c.lat,
          lng: c.lng,
          href: `/development/city/${c.id}`,
          live: !!c.socrata,
          metroUnits: share,
          row,
        });
      }
    } else {
      // No tracked city in this state — fall back to its centroid.
      const ctr = STATE_CENTROID[state];
      if (!ctr) continue;
      spots.push({
        id: `state-${state}`,
        name: state,
        state,
        lat: ctr.lat,
        lng: ctr.lng,
        live: false,
        metroUnits: row.totalUnits,
        row,
      });
    }
  }

  const max = Math.max(1, ...spots.map((s) => s.metroUnits));

  return (
    <div className="relative rounded-[var(--radius-card)] overflow-hidden border border-line" style={{ height }}>
      <MapContainer center={[39.5, -97]} zoom={4} minZoom={3} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {spots.map((s) => {
          const r = 5 + Math.sqrt(s.metroUnits / max) * 26;
          const mfShare = s.row.totalUnits ? s.row.units5 / s.row.totalUnits : 0;
          const fill = mfShare > 0.5 ? "#3a6ea5" : "#9a7b2e";
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={r}
              pathOptions={{
                color: s.live ? "#2f7d4f" : fill,
                weight: s.live ? 2 : 1,
                fillColor: fill,
                fillOpacity: 0.42,
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-display text-[15px] font-semibold text-ink">
                    {s.name}{s.id.startsWith("state-") ? "" : `, ${s.state}`}
                  </div>
                  {s.live && (
                    <div className="text-[11px] font-semibold text-good mb-0.5">Live permit portal</div>
                  )}
                  <div className="text-xs text-muted mb-1.5">{s.state} Building Permits Survey · statewide</div>
                  <div className="text-xs text-ink-soft num">Total units: <b>{fmtNum(s.row.totalUnits)}</b></div>
                  <div className="text-xs text-muted num">Single-family (1-unit): {fmtNum(s.row.units1)}</div>
                  <div className="text-xs text-muted num">Multifamily (5+): {fmtNum(s.row.units5)}</div>
                  <div className="text-xs text-muted num">Declared value: ${fmtNum(s.row.valueThousands)}K</div>
                  {s.href && (
                    <a href={s.href} className="inline-block mt-1.5 text-xs font-semibold text-gold-deep">
                      Explore {s.name} developments →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[500] bg-surface/90 backdrop-blur border border-line rounded-full px-3 py-1.5 text-[11px] text-muted shadow-[var(--shadow)]">
        Bubbles anchored on tracked metros · size = state permit volume · blue = multifamily-led
      </div>
    </div>
  );
}
