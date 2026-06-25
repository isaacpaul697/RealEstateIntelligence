"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { BpsStateRow } from "@/lib/dev/types";
import { STATE_CENTROID } from "@/lib/dev/live/bps";
import { fmtNum } from "@/lib/dev/format";

export default function NationalMapInner({
  states,
  height = 460,
}: {
  states: BpsStateRow[];
  height?: number;
}) {
  const max = Math.max(1, ...states.map((s) => s.totalUnits));

  return (
    <div className="relative rounded-[var(--radius-card)] overflow-hidden border border-line" style={{ height }}>
      <MapContainer center={[39.5, -97]} zoom={4} minZoom={3} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {states.map((s) => {
          const c = STATE_CENTROID[s.state];
          if (!c) return null;
          const r = 6 + Math.sqrt(s.totalUnits / max) * 34;
          const mfShare = s.totalUnits ? s.units5 / s.totalUnits : 0;
          return (
            <CircleMarker
              key={s.state}
              center={[c.lat, c.lng]}
              radius={r}
              pathOptions={{
                color: "#9a7b2e",
                weight: 1,
                fillColor: mfShare > 0.5 ? "#3a6ea5" : "#9a7b2e",
                fillOpacity: 0.45,
              }}
            >
              <Popup>
                <div className="min-w-[190px]">
                  <div className="font-display text-[15px] font-semibold text-ink">{s.state}</div>
                  <div className="text-xs text-muted mb-1.5">Building Permits Survey · units authorized</div>
                  <div className="text-xs text-ink-soft num">Total units: <b>{fmtNum(s.totalUnits)}</b></div>
                  <div className="text-xs text-muted num">Single-family (1-unit): {fmtNum(s.units1)}</div>
                  <div className="text-xs text-muted num">Multifamily (5+): {fmtNum(s.units5)}</div>
                  <div className="text-xs text-muted num">Declared value: ${fmtNum(s.valueThousands)}K</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[500] bg-surface/90 backdrop-blur border border-line rounded-full px-3 py-1.5 text-[11px] text-muted shadow-[var(--shadow)]">
        Bubble size = units authorized · blue = multifamily-led
      </div>
    </div>
  );
}
