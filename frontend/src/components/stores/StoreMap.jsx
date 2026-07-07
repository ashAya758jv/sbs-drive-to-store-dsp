import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, MapPinned } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import { brand } from "../../styles/theme";

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

/** Violet SBS marker (a plain divIcon avoids the classic broken-default-icon
 * issue Leaflet has with bundlers, since it needs no external image assets). */
function buildMarkerIcon() {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${brand.primary};border:3px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.35);"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

/** Normalize a store_url so it's always a clickable absolute link. */
function absoluteUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Popup content built with DOM nodes (not innerHTML) so store data coming
 * from an uploaded file can never be interpreted as markup.
 */
function buildPopupContent(store) {
  const wrapper = document.createElement("div");
  wrapper.style.minWidth = "190px";
  wrapper.style.fontFamily = "inherit";

  const name = document.createElement("p");
  name.style.cssText = "margin:0 0 4px;font-weight:600;font-size:13px;color:#0f172a;";
  name.textContent = store.name;
  wrapper.appendChild(name);

  const location = [store.city, store.address].filter(Boolean).join(" · ");
  if (location) {
    const locationEl = document.createElement("p");
    locationEl.style.cssText = "margin:0 0 4px;font-size:12px;color:#64748b;";
    locationEl.textContent = location;
    wrapper.appendChild(locationEl);
  }

  if (store.opening_hours) {
    const hours = document.createElement("p");
    hours.style.cssText = "margin:0 0 6px;font-size:12px;color:#64748b;";
    hours.textContent = `Horaires : ${store.opening_hours}`;
    wrapper.appendChild(hours);
  }

  if (store.store_url) {
    const link = document.createElement("a");
    link.href = absoluteUrl(store.store_url);
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Voir la fiche magasin →";
    link.style.cssText = `font-size:12px;font-weight:500;color:${brand.primary};text-decoration:underline;`;
    wrapper.appendChild(link);
  }

  return wrapper;
}

function isFiniteCoord(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Interactive map (Leaflet + OpenStreetMap tiles — no API key required)
 * showing imported stores as markers, auto-centered on the current data.
 * Fully self-contained: renders its own card header, counter and empty state.
 */
export default function StoreMap({ stores = [] }) {
  const containerRef = useRef(null);

  const validStores = useMemo(
    () =>
      stores.filter(
        (store) =>
          isFiniteCoord(store.latitude) && isFiniteCoord(store.longitude),
      ),
    [stores],
  );

  useEffect(() => {
    if (!containerRef.current || validStores.length === 0) return undefined;

    const map = L.map(containerRef.current, { scrollWheelZoom: true });

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const markers = validStores.map((store) => {
      const marker = L.marker([store.latitude, store.longitude], {
        icon: buildMarkerIcon(),
      });
      marker.bindPopup(buildPopupContent(store));
      marker.addTo(map);
      return marker;
    });

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 14);
    } else {
      map.fitBounds(L.latLngBounds(markers.map((m) => m.getLatLng())), {
        padding: [32, 32],
      });
    }

    // The container's real size can only be measured after paint.
    const raf = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
    };
  }, [validStores]);

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <MapPinned className="h-4 w-4 text-primary-600" />
            Carte des magasins importés
          </h2>
          <p className="text-sm text-slate-400">
            Visualisation géographique des points de vente validés
          </p>
        </div>
        <Badge variant="primary">
          {validStores.length} magasin{validStores.length > 1 ? "s" : ""} affiché
          {validStores.length > 1 ? "s" : ""} sur la carte
        </Badge>
      </div>

      {validStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-lavender-50 py-16 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <MapPin className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-slate-700">
            Aucun magasin importé pour l'instant
          </p>
          <p className="max-w-sm text-xs text-slate-400">
            Importez et analysez un fichier ci-dessus : les magasins valides
            s'afficheront ici sous forme de marqueurs.
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200"
        />
      )}
    </Card>
  );
}
