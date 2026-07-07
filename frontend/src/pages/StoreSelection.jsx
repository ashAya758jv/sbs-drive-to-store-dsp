import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Search,
  Upload,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import { EXPECTED_COLUMNS, previewStoreImport } from "../data/storesApi";
import StoreMap from "../components/stores/StoreMap";
import { cn } from "../lib/cn";

/** Default geofencing radius (km) applied to a store when it is first selected. */
const DEFAULT_RADIUS_KM = 5;

/* Small stat tile shown in the analysis summary. */
function StatTile({ label, value, tone }) {
  const tones = {
    neutral: "border-slate-200 bg-white text-slate-900",
    success: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    danger: "border-rose-200 bg-rose-50/60 text-rose-700",
  };
  return (
    <div className={cn("rounded-xl border p-4", tones[tone])}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </p>
    </div>
  );
}

export default function StoreSelection() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [cityFilter, setCityFilter] = useState("");
  // Per-store geofencing radius (km), keyed by store_id. Persists across
  // deselect/reselect so a re-selected store keeps its previously chosen radius.
  const [radii, setRadii] = useState({});

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setApiError(null);
    setSelectedIds(new Set());
    setCityFilter("");
    setRadii({});
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setApiError(null);
    setSelectedIds(new Set());
    setCityFilter("");
    setRadii({});
    try {
      setPreview(await previewStoreImport(file));
    } catch (err) {
      setPreview(null);
      setApiError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const hasRowErrors = preview?.errors?.length > 0;
  const hasMissingColumns = preview?.missing_columns?.length > 0;
  const allValid =
    preview && preview.total_rows > 0 && preview.error_count === 0 && !hasMissingColumns;

  /** Cities available in the current import, for the city/region filter. */
  const cityOptions = useMemo(() => {
    const cities = new Set(
      (preview?.stores ?? []).map((store) => store.city).filter(Boolean),
    );
    return [
      { value: "", label: "Toutes les villes" },
      ...[...cities].sort((a, b) => a.localeCompare(b)).map((city) => ({
        value: city,
        label: city,
      })),
    ];
  }, [preview]);

  /** Stores matching the active city filter (drives both the table and the map). */
  const filteredStores = useMemo(() => {
    const stores = preview?.stores ?? [];
    return cityFilter ? stores.filter((store) => store.city === cityFilter) : stores;
  }, [preview, cityFilter]);

  /** Toggle a single store — called from the table checkbox and from the map. */
  const handleToggleSelect = useCallback((storeId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  }, []);

  /** Select every store currently visible under the active city filter. */
  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredStores.forEach((store) => next.add(store.store_id));
      return next;
    });
  };

  /** Deselect every store currently visible under the active city filter. */
  const handleDeselectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredStores.forEach((store) => next.delete(store.store_id));
      return next;
    });
  };

  /** Effective radius of a store (chosen value, else the default). */
  const radiusOf = useCallback(
    (storeId) => radii[storeId] ?? DEFAULT_RADIUS_KM,
    [radii],
  );

  /** Update one store's geofencing radius (live, from its slider). */
  const handleRadiusChange = (storeId, km) => {
    setRadii((prev) => ({ ...prev, [storeId]: km }));
  };

  /** Selected stores (all of them, independent of the city filter), for the
   *  radius configuration section. */
  const selectedStores = useMemo(
    () => (preview?.stores ?? []).filter((store) => selectedIds.has(store.store_id)),
    [preview, selectedIds],
  );

  /** Average configured radius across the selected stores (for the counter). */
  const averageRadius = useMemo(() => {
    if (selectedStores.length === 0) return 0;
    const total = selectedStores.reduce(
      (sum, store) => sum + (radii[store.store_id] ?? DEFAULT_RADIUS_KM),
      0,
    );
    return Math.round((total / selectedStores.length) * 10) / 10;
  }, [selectedStores, radii]);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Magasins" }]}
        title="Magasins"
        subtitle="Importez la base de données client des points de vente"
      />

      {/* Import card */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Import BDD client
          </h2>
          <p className="text-sm text-slate-400">
            Chargez le fichier des magasins fourni par le client (.xlsx ou .csv),
            puis lancez l'analyse pour vérifier les données avant import.
          </p>
        </div>

        {/* Upload zone */}
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            file
              ? "border-primary-300 bg-primary-50/50"
              : "border-slate-200 bg-lavender-50 hover:border-primary-300 hover:bg-primary-50/40",
          )}
        >
          <input
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-600 text-white">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-400">
                Cliquez pour choisir un autre fichier
              </p>
            </>
          ) : (
            <>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                <Upload className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-700">
                Cliquez pour choisir un fichier
              </p>
              <p className="text-xs text-slate-400">Formats acceptés : .xlsx, .csv</p>
            </>
          )}
        </label>

        {/* Expected columns hint */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Colonnes obligatoires attendues (1ʳᵉ ligne du fichier) :
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXPECTED_COLUMNS.map((column) => (
              <code
                key={column}
                className="rounded-md bg-white px-2 py-0.5 text-xs text-primary-700 ring-1 ring-slate-200"
              >
                {column}
              </code>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button onClick={handleAnalyze} disabled={!file || analyzing}>
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Analyser le fichier
          </Button>
        </div>

        {/* API-level error (backend down, wrong format, unreadable file…) */}
        {apiError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {apiError}
          </div>
        )}
      </Card>

      {/* Analysis result */}
      {preview && (
        <>
          {/* Summary */}
          <Card className="mt-6 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Résultat de l'analyse
              </h2>
              <Badge variant="neutral">{preview.filename}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label="Lignes analysées" value={preview.total_rows} tone="neutral" />
              <StatTile label="Lignes valides" value={preview.valid_count} tone="success" />
              <StatTile label="Lignes en erreur" value={preview.error_count} tone="danger" />
            </div>

            <div
              className={cn(
                "mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm",
                allValid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800",
              )}
            >
              {allValid ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {preview.message}
            </div>
          </Card>

          {/* Missing columns */}
          {hasMissingColumns && (
            <Card className="mt-6 border-amber-200 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Colonnes manquantes dans l'en-tête
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {preview.missing_columns.map((column) => (
                  <code
                    key={column}
                    className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200"
                  >
                    {column}
                  </code>
                ))}
              </div>
            </Card>
          )}

          {/* Row errors */}
          {hasRowErrors && (
            <Card className="mt-6 border-rose-200">
              <div className="border-b border-rose-100 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                  Erreurs détectées ({preview.errors.length})
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Corrigez ces lignes dans le fichier puis relancez l'analyse.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-rose-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Ligne</th>
                      <th className="px-5 py-3 font-medium">Champ</th>
                      <th className="px-5 py-3 font-medium">Erreur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {preview.errors.map((error, index) => (
                      <tr key={`${error.row}-${error.field}-${index}`}>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {error.row}
                        </td>
                        <td className="px-5 py-3">
                          <code className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700">
                            {error.field}
                          </code>
                        </td>
                        <td className="px-5 py-3 text-rose-700">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Valid stores */}
          {preview.stores.length > 0 && (
            <Card className="mt-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Magasins valides ({preview.valid_count})
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Sélectionnez les magasins à utiliser pour la campagne. Ils
                    sont aussi affichés sur la carte ci-dessous.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Select
                    label="Ville"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    options={cityOptions}
                    className="w-44"
                  />
                  <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                    Tout sélectionner
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleDeselectAll}>
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {/* Selection counter */}
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2.5">
                <Badge variant="success">
                  {selectedIds.size} magasin{selectedIds.size !== 1 ? "s" : ""}{" "}
                  sélectionné{selectedIds.size !== 1 ? "s" : ""}
                </Badge>
                <span className="text-xs text-slate-400">
                  / {preview.stores.length} magasin
                  {preview.stores.length !== 1 ? "s" : ""} disponible
                  {preview.stores.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="w-10 px-5 py-3 font-medium">
                        <span className="sr-only">Sélection</span>
                      </th>
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">Nom</th>
                      <th className="px-5 py-3 font-medium">Ville</th>
                      <th className="px-5 py-3 font-medium">Adresse</th>
                      <th className="px-5 py-3 text-right font-medium">Latitude</th>
                      <th className="px-5 py-3 text-right font-medium">Longitude</th>
                      <th className="px-5 py-3 font-medium">Horaires</th>
                      <th className="px-5 py-3 font-medium">URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-10 text-center text-sm text-slate-400"
                        >
                          Aucun magasin ne correspond à ce filtre.
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((store) => {
                        const selected = selectedIds.has(store.store_id);
                        return (
                          <tr
                            key={store.store_id}
                            className={cn(
                              "transition-colors hover:bg-lavender-50",
                              selected && "bg-primary-50/40",
                            )}
                          >
                            <td className="px-5 py-3">
                              <input
                                type="checkbox"
                                aria-label={`Sélectionner ${store.name}`}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-primary-600"
                                checked={selected}
                                onChange={() => handleToggleSelect(store.store_id)}
                              />
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-800">
                              {store.store_id}
                            </td>
                            <td className="px-5 py-3 text-slate-700">{store.name}</td>
                            <td className="px-5 py-3 text-slate-500">{store.city}</td>
                            <td className="px-5 py-3 text-slate-500">{store.address}</td>
                            <td className="px-5 py-3 text-right text-slate-600">
                              {store.latitude}
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600">
                              {store.longitude}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {store.opening_hours}
                            </td>
                            <td className="max-w-[180px] truncate px-5 py-3">
                              <a
                                href={store.store_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-700 hover:underline"
                                title={store.store_url}
                              >
                                {store.store_url}
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Geofencing radius per selected store */}
          {selectedStores.length > 0 && (
            <Card className="mt-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Rayons de ciblage (geofencing)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Ajustez le rayon de diffusion autour de chaque magasin
                    sélectionné (1 à 20 km). Le cercle correspondant s'affiche sur
                    la carte.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">
                    {selectedStores.length} sélectionné
                    {selectedStores.length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="primary">Rayon moyen : {averageRadius} km</Badge>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {selectedStores.map((store) => {
                  const km = radiusOf(store.store_id);
                  return (
                    <div
                      key={store.store_id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 sm:w-1/3">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {store.name}
                        </p>
                        <p className="text-xs text-slate-400">{store.city}</p>
                      </div>
                      <div className="flex flex-1 items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={km}
                          aria-label={`Rayon de ciblage pour ${store.name}`}
                          onChange={(e) =>
                            handleRadiusChange(store.store_id, Number(e.target.value))
                          }
                          className="h-2 w-full cursor-pointer accent-primary-600"
                        />
                        <span className="w-14 shrink-0 text-right text-sm font-semibold text-primary-700">
                          {km} km
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Interactive map of the valid, imported stores — kept in sync
              with the table's selection, city filter and geofencing radii. */}
          <StoreMap
            stores={filteredStores}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            radii={radii}
            defaultRadiusKm={DEFAULT_RADIUS_KM}
          />
        </>
      )}
    </>
  );
}
