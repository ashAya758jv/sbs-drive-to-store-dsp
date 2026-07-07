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

/**
 * Violet SBS marker (a plain divIcon avoids the classic broken-default-icon
 * issue Leaflet has with bundlers, since it needs no external image assets).
 * Selected stores render bigger, with a halo and a checkmark, so the two
 * states stay readable at a glance directly on the map.
 */
function buildMarkerIcon(selected) {
  if (selected) {
    return L.divIcon({
      className: "",
      html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${brand.primary};border:3px solid #ffffff;box-shadow:0 0 0 3px ${brand.primary}55,0 1px 4px rgba(15,23,42,0.35);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }
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
 * from an uploaded file can never be interpreted as markup. Includes a
 * selection checkbox so a store can be selected/deselected from the popup,
 * in addition to clicking the marker itself.
 */
function buildPopupContent(store, selected, onToggleSelect) {
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
    link.style.cssText = `display:block;margin-bottom:8px;font-size:12px;font-weight:500;color:${brand.primary};text-decoration:underline;`;
    wrapper.appendChild(link);
  }

  const selectRow = document.createElement("label");
  selectRow.style.cssText =
    "display:flex;align-items:center;gap:6px;padding-top:8px;border-top:1px solid #e2e8f0;cursor:pointer;font-size:12px;font-weight:500;color:#334155;";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(selected);
  checkbox.style.cssText = `width:14px;height:14px;accent-color:${brand.primary};cursor:pointer;`;
  checkbox.addEventListener("change", () => onToggleSelect?.(store.store_id));
  const labelText = document.createElement("span");
  labelText.textContent = selected ? "Sélectionné" : "Sélectionner ce magasin";
  selectRow.appendChild(checkbox);
  selectRow.appendChild(labelText);
  wrapper.appendChild(selectRow);

  return wrapper;
}

function isFiniteCoord(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Interactive map (Leaflet + OpenStreetMap tiles — no API key required)
 * showing imported stores as markers, auto-centered on the current data.
 * Fully self-contained: renders its own card header, counter and empty state.
 *
 * Stores can be selected/deselected directly from the map (marker click, or
 * the checkbox inside the popup) — kept in sync with the table via the
 * `selectedIds` / `onToggleSelect` props owned by the parent page.
 */
export default function StoreMap({
  stores = [],
  selectedIds,
  onToggleSelect,
  radii,
  defaultRadiusKm = 5,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circlesLayerRef = useRef(null);
  const circlesRef = useRef(new Map());
  const reopenPopupForRef = useRef(null);

  const validStores = useMemo(
    () =>
      stores.filter(
        (store) =>
          isFiniteCoord(store.latitude) && isFiniteCoord(store.longitude),
      ),
    [stores],
  );

  // Effect 1 — mount/unmount the map, tile layer and marker layer group, and
  // auto-fit the view. Only re-runs when the underlying store list changes
  // (a new import/filter), never on a plain selection toggle, so the map
  // doesn't jump around every time a checkbox is (de)selected.
  useEffect(() => {
    if (!containerRef.current || validStores.length === 0) return undefined;

    const map = L.map(containerRef.current, { scrollWheelZoom: true });
    mapRef.current = map;
    const circles = circlesRef.current; // stable Map, captured for cleanup

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Circles first so the markers layer stays on top and clickable.
    circlesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    const fitToStores = () => {
      if (validStores.length === 1) {
        map.setView([validStores[0].latitude, validStores[0].longitude], 14);
      } else {
        map.fitBounds(
          L.latLngBounds(validStores.map((s) => [s.latitude, s.longitude])),
          { padding: [32, 32] },
        );
      }
    };

    // Size the container first, then compute the view — running fitBounds
    // before the container has its real size can break Leaflet's projection
    // (markers/circles land far outside the visible map).
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      fitToStores();
    });

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      circlesLayerRef.current = null;
      circles.clear();
    };
  }, [validStores]);

  // Effect 2 — (re)build the markers whenever the store list or the
  // selection changes. Reopens the popup of the marker the user just
  // (de)selected, so toggling from the popup itself doesn't make it vanish.
  useEffect(() => {
    const layerGroup = markersLayerRef.current;
    if (!layerGroup) return undefined;

    layerGroup.clearLayers();

    const handleToggle = (storeId) => {
      reopenPopupForRef.current = storeId;
      onToggleSelect?.(storeId);
    };

    let markerToReopen = null;
    validStores.forEach((store) => {
      const selected = selectedIds?.has(store.store_id) ?? false;
      const marker = L.marker([store.latitude, store.longitude], {
        icon: buildMarkerIcon(selected),
      });
      marker.bindPopup(buildPopupContent(store, selected, handleToggle));
      marker.on("click", () => handleToggle(store.store_id));
      marker.addTo(layerGroup);
      if (reopenPopupForRef.current === store.store_id) markerToReopen = marker;
    });

    if (markerToReopen) {
      markerToReopen.openPopup();
      reopenPopupForRef.current = null;
    }
  }, [validStores, selectedIds, onToggleSelect]);

  // Effect 3 — geofencing circles around each selected store, reconciled in
  // place so dragging the radius slider resizes the circle in real time
  // without rebuilding the markers (which would close any open popup).
  useEffect(() => {
    const layer = circlesLayerRef.current;
    if (!layer) return;
    const circles = circlesRef.current;
    const stillSelected = new Set();

    validStores.forEach((store) => {
      const selected = selectedIds?.has(store.store_id) ?? false;
      if (!selected) return;
      stillSelected.add(store.store_id);
      const km = radii?.[store.store_id] ?? defaultRadiusKm;
      const meters = (km || defaultRadiusKm) * 1000;
      const existing = circles.get(store.store_id);
      if (existing) {
        existing.setLatLng([store.latitude, store.longitude]);
        existing.setRadius(meters);
      } else {
        const circle = L.circle([store.latitude, store.longitude], {
          radius: meters,
          interactive: false, // never intercept marker clicks
          color: brand.primary,
          weight: 2,
          opacity: 0.7,
          fillColor: brand.primary,
          fillOpacity: 0.12,
        });
        circle.addTo(layer);
        circles.set(store.store_id, circle);
      }
    });

    // Drop circles for stores no longer selected / no longer visible.
    circles.forEach((circle, id) => {
      if (!stillSelected.has(id)) {
        layer.removeLayer(circle);
        circles.delete(id);
      }
    });
  }, [validStores, selectedIds, radii, defaultRadiusKm]);

  const selectedCount =
    selectedIds && validStores.length > 0
      ? validStores.filter((s) => selectedIds.has(s.store_id)).length
      : 0;

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
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds && (
            <Badge variant="success">{selectedCount} sélectionné(s)</Badge>
          )}
          <Badge variant="primary">
            {validStores.length} magasin{validStores.length > 1 ? "s" : ""} affiché
            {validStores.length > 1 ? "s" : ""} sur la carte
          </Badge>
        </div>
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
        <>
          <div
            ref={containerRef}
            className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200"
          />
          <p className="mt-3 text-xs text-slate-400">
            Cliquez sur un marqueur (ou sur la case dans son popup) pour
            sélectionner/désélectionner un magasin. Le cercle violet représente
            le rayon de ciblage réglé pour chaque magasin sélectionné.
          </p>
        </>
      )}
    </Card>
  );
}
