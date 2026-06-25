"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DevView } from "@/lib/dev/view";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/dev/types";
import { fmtCompactUSD } from "@/lib/dev/format";

function pin(type: keyof typeof TYPE_COLOR, big: boolean) {
  const color = TYPE_COLOR[type];
  const s = big ? 22 : 16;
  const html = `<div style="width:${s}px;height:${s}px;border-radius:9999px;background:${color};
    box-shadow:0 0 0 2px #fffefb,0 1px 4px rgba(0,0,0,.4)"></div>`;
  return L.divIcon({ html, className: "dev-pin", iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
}

/** External web search for a development — its address + city, plus the
 *  developer/firm when known (which surfaces the company's own site). */
function searchUrl(d: DevView, cityLabel?: string): string {
  const q = [d.address !== "—" ? d.address : null, cityLabel, d.developer]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function DevMapInner({
  devs,
  center,
  zoom,
  scan,
  cityLabel,
  height = 520,
}: {
  devs: DevView[];
  center: [number, number];
  zoom: number;
  scan?: { lat: number; lng: number; radius: number } | null;
  cityLabel?: string;
  height?: number;
}) {
  // Cap rendered markers for performance; the list view shows all.
  const shown = useMemo(() => devs.slice(0, 600), [devs]);

  return (
    <div className="relative rounded-[var(--radius-card)] overflow-hidden border border-line" style={{ height }}>
      <MapContainer center={center} zoom={zoom} minZoom={3} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Recenter center={center} zoom={zoom} />
        {scan && (
          <Circle
            center={[scan.lat, scan.lng]}
            radius={scan.radius}
            pathOptions={{ color: "#9a7b2e", weight: 1.5, dashArray: "6 6", fillColor: "#9a7b2e", fillOpacity: 0.06 }}
          />
        )}
        {shown.map((d) => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={pin(d.type, d.cost.value != null && d.cost.value > 5_000_000)}>
            <Popup>
              <div className="min-w-[200px]">
                <div className="text-[11px] font-semibold" style={{ color: TYPE_COLOR[d.type] }}>{TYPE_LABEL[d.type]}</div>
                <div className="font-display text-[14px] font-semibold text-ink leading-snug">{d.address}</div>
                <div className="text-xs text-muted mt-0.5 line-clamp-2">{d.description || d.rawType}</div>
                <div className="text-xs text-ink-soft mt-1.5 num">
                  Est. cost {fmtCompactUSD(d.cost.value)} <span className="text-muted-2">({d.cost.provenance})</span>
                </div>
                {d.developer && <div className="text-xs text-muted truncate">{d.developer}</div>}
                <a
                  href={searchUrl(d, cityLabel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-gold-deep hover:underline"
                >
                  Open development ↗
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {scan && (
        <div className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 bg-surface/90 backdrop-blur border border-line rounded-full px-3 py-1.5 text-[11px] text-muted shadow-[var(--shadow)]">
          <span className="w-3 h-3 rounded-full border border-dashed border-gold" style={{ background: "rgba(154,123,46,.1)" }} />
          Scanned area · {(scan.radius / 1000).toFixed(1)} km radius
        </div>
      )}
      {devs.length > 600 && (
        <div className="absolute bottom-3 right-3 z-[500] bg-surface/90 backdrop-blur border border-line rounded-full px-3 py-1.5 text-[11px] text-muted shadow-[var(--shadow)]">
          Showing 600 of {devs.length.toLocaleString()} pins
        </div>
      )}
    </div>
  );
}
