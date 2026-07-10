import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { brand } from "../../styles/theme";

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

/** Same violet dot marker used across the app's Leaflet maps (see StoreMap.jsx). */
function buildMarkerIcon() {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${brand.primary};border:3px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.35);"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

/** Popup built with DOM nodes (no innerHTML) — same safety rule as elsewhere. */
function buildPopupContent(row) {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "min-width:170px;font-family:inherit;";

  const name = document.createElement("p");
  name.style.cssText = "margin:0 0 4px;font-weight:600;font-size:13px;color:#0f172a;";
  name.textContent = row.storeName;
  wrapper.appendChild(name);

  const city = document.createElement("p");
  city.style.cssText = "margin:0 0 4px;font-size:12px;color:#64748b;";
  city.textContent = row.city;
  wrapper.appendChild(city);

  const campaign = document.createElement("p");
  campaign.style.cssText = "margin:0 0 4px;font-size:12px;color:#64748b;";
  campaign.textContent = `Campagne : ${row.campaignLabel}`;
  wrapper.appendChild(campaign);

  const radius = document.createElement("p");
  radius.style.cssText = `margin:0;font-size:12px;font-weight:500;color:${brand.primary};`;
  radius.textContent = `Rayon de diffusion : ${row.radiusKm} km`;
  wrapper.appendChild(radius);

  return wrapper;
}

function isFiniteCoord(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Read-only map (Leaflet + OpenStreetMap, no API key) showing each reporting
 * row's store as a marker, surrounded by a violet circle representing its
 * mock diffusion radius (5/10/15 km). No selection interaction — this is a
 * reporting visualization, distinct from the store-picker map on /magasins
 * (see components/stores/StoreMap.jsx).
 */
export default function ReportingZonesMap({ rows }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const validRows = useMemo(
    () => rows.filter((row) => isFiniteCoord(row.latitude) && isFiniteCoord(row.longitude)),
    [rows],
  );

  useEffect(() => {
    if (!containerRef.current || validRows.length === 0) return undefined;

    const map = L.map(containerRef.current, { scrollWheelZoom: true });
    mapRef.current = map;

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    const circlesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    validRows.forEach((row) => {
      L.circle([row.latitude, row.longitude], {
        radius: row.radiusKm * 1000,
        interactive: false,
        color: brand.primary,
        weight: 2,
        opacity: 0.6,
        fillColor: brand.primary,
        fillOpacity: 0.1,
      }).addTo(circlesLayer);

      const marker = L.marker([row.latitude, row.longitude], { icon: buildMarkerIcon() });
      marker.bindPopup(buildPopupContent(row));
      marker.addTo(markersLayer);
    });

    const fitToRows = () => {
      if (validRows.length === 1) {
        map.setView([validRows[0].latitude, validRows[0].longitude], 11);
      } else {
        map.fitBounds(
          L.latLngBounds(validRows.map((row) => [row.latitude, row.longitude])),
          { padding: [40, 40] },
        );
      }
    };

    // Container may start at 0 width (card just mounted) — resize + fit only
    // once it has a real size, same fix already validated on /magasins.
    let fitted = false;
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
      if (!fitted && containerRef.current && containerRef.current.clientWidth > 0) {
        fitToRows();
        fitted = true;
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [validRows]);

  if (validRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-lavender-50 py-16 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
          <MapPin className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-slate-700">
          Aucun magasin ne correspond aux filtres actuels
        </p>
        <p className="max-w-sm text-xs text-slate-400">
          Modifiez la période, la campagne ou la ville pour afficher les zones
          de diffusion.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200"
    />
  );
}
