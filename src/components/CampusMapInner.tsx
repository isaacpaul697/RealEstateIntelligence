"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Apartment } from "@/lib/types";
import type { ScoredMarket } from "@/lib/compute";
import { scoreTone } from "./charts";

const TONE_HEX: Record<string, string> = {
  good: "#3f7a4f",
  warn: "#b07a23",
  info: "#3a6ea5",
  bad: "#b23b2c",
};

function campusIcon(m: ScoredMarket, selected: boolean) {
  const tone = TONE_HEX[scoreTone(m.score.score)];
  const size = selected ? 56 : 46;
  const inner =
    m.market.logo
      ? `<img src="${m.market.logo}" style="width:${size * 0.62}px;height:${size * 0.62}px;object-fit:contain" alt="" onerror="this.style.display='none'"/>`
      : `<span style="font-weight:700;color:#fff;font-size:${size * 0.3}px">${m.market.abbr}</span>`;
  const bg = m.market.logo ? "#fff" : m.market.brandColor;
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px">
      <div style="position:absolute;inset:0;border-radius:9999px;background:${bg};
        display:grid;place-items:center;box-shadow:0 0 0 3px ${tone},0 4px 12px rgba(0,0,0,.25);overflow:hidden">${inner}</div>
      <div style="position:absolute;bottom:-6px;right:-6px;background:${tone};color:#fff;font-size:11px;
        font-weight:700;min-width:20px;height:20px;border-radius:9999px;display:grid;place-items:center;
        padding:0 4px;box-shadow:0 0 0 2px #fffefb">${m.score.score}</div>
    </div>`;
  return L.divIcon({ html, className: "cc-logo-marker", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

const aptIcon = (hover = false) =>
  L.divIcon({
    html: `<div style="width:${hover ? 16 : 12}px;height:${hover ? 16 : 12}px;border-radius:9999px;
      background:#9a7b2e;box-shadow:0 0 0 3px rgba(154,123,46,.25),0 1px 3px rgba(0,0,0,.4)"></div>`,
    className: "cc-logo-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

function Fly({ target }: { target: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.1 });
    else map.flyTo([39.5, -97], 4, { duration: 1.1 });
  }, [target, map]);
  return null;
}

export default function CampusMapInner({
  markets,
  initialSelected,
  height = 560,
}: {
  markets: ScoredMarket[];
  initialSelected?: string;
  height?: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loadingApts, setLoadingApts] = useState(false);

  const sel = markets.find((m) => m.market.id === selected) ?? null;

  useEffect(() => {
    if (!selected) {
      setApartments([]);
      return;
    }
    let alive = true;
    setLoadingApts(true);
    setApartments([]);
    fetch(`/api/market/${selected}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setApartments(d.apartments ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingApts(false);
      });
    return () => {
      alive = false;
    };
  }, [selected]);

  const target = sel ? { lat: sel.market.lat, lng: sel.market.lng, zoom: 13 } : null;

  const campusIcons = useMemo(
    () => new Map(markets.map((m) => [m.market.id, campusIcon(m, m.market.id === selected)])),
    [markets, selected],
  );

  return (
    <div className="relative rounded-[var(--radius-card)] overflow-hidden border border-line" style={{ height }}>
      <MapContainer
        center={[39.5, -97]}
        zoom={4}
        minZoom={3}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Fly target={target} />

        {markets.map((m) => (
          <Marker
            key={m.market.id}
            position={[m.market.lat, m.market.lng]}
            icon={campusIcons.get(m.market.id)!}
            eventHandlers={{ click: () => setSelected(m.market.id) }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-display text-[15px] font-semibold text-ink">{m.market.shortName}</div>
                <div className="text-xs text-muted mb-1.5">{m.market.city}, {m.market.state} · {m.market.conference}</div>
                <div className="text-xs text-ink-soft">Acquisition score <b className="num">{m.score.score}</b> · {m.score.label}</div>
                {m.market.enrollment != null && (
                  <div className="text-xs text-muted num">{m.market.enrollment.toLocaleString()} students</div>
                )}
                <button
                  onClick={() => router.push(`/market/${m.market.id}`)}
                  className="mt-2 text-xs font-semibold text-gold-deep hover:underline"
                >
                  Open market →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {sel &&
          apartments.map((a) => (
            <Marker key={a.id} position={[a.lat, a.lng]} icon={aptIcon()}>
              <Popup>
                <div className="min-w-[170px]">
                  <div className="font-semibold text-ink text-[13px]">{a.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {a.street ? `${a.street} · ` : ""}{a.distanceMi.toFixed(1)} mi from campus
                  </div>
                  {a.website ? (
                    <a href={a.website} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1.5 text-xs font-semibold text-gold-deep hover:underline">
                      Visit website →
                    </a>
                  ) : a.searchUrl ? (
                    <a href={a.searchUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-1.5 text-xs font-medium text-muted hover:text-ink">
                      Search for website →
                    </a>
                  ) : (
                    <span className="inline-block mt-1.5 text-xs text-muted-2">No website on record</span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* overlay control */}
      <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 cc-fade">
        {sel ? (
          <div className="flex items-center gap-2 bg-surface/95 backdrop-blur border border-line rounded-full pl-2 pr-1 py-1 shadow-[var(--shadow)]">
            <span className="text-xs font-semibold text-ink px-1">{sel.market.shortName}</span>
            <span className="text-[11px] text-muted">
              {loadingApts ? "finding apartments…" : `${apartments.length} apartments`}
            </span>
            <button onClick={() => setSelected(null)}
              className="text-xs font-semibold bg-surface-2 hover:bg-line rounded-full px-2.5 py-1 text-ink-soft">
              ← US view
            </button>
          </div>
        ) : (
          <div className="bg-surface/95 backdrop-blur border border-line rounded-full px-3 py-1.5 shadow-[var(--shadow)] text-xs text-muted">
            Click a campus to zoom in and reveal nearby apartments
          </div>
        )}
      </div>
    </div>
  );
}
