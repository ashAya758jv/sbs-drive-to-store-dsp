import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileImage,
  Info,
  Link2,
  Loader2,
  MapPin,
  Maximize2,
  RectangleHorizontal,
  Sparkles,
  Square,
  Upload,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { getCampaignOptions, FALLBACK_OPTIONS } from "../data/campaignApi";
import { apiGet } from "../lib/api";
import {
  ACCEPTED_EXTENSIONS_LABEL,
  isAcceptedImage,
  uploadCreative,
} from "../data/dcoApi";
import { cn } from "../lib/cn";

/** Example store shown when no client data could be fetched (API offline). */
const GENERIC_EXAMPLE_STORE = {
  name: "Marjane Californie",
  city: "Casablanca",
  address: "Bd Panoramique, Californie",
  opening_hours: "09:00 - 22:00",
  store_url: "https://www.marjane.ma/californie",
};

/** Icon shown per ad-slot format, purely visual. */
const FORMAT_ICONS = {
  banner: RectangleHorizontal,
  rectangle: Square,
  interstitial: Maximize2,
};

const EMPTY_ASSET = { file: null, previewUrl: null, error: null, status: "empty" };

/** One upload zone for a single ad-slot format (bannière / pavé / interstitiel). */
function FormatUploadCard({ format, asset, onFileChange }) {
  const Icon = FORMAT_ICONS[format.value] ?? FileImage;
  const inputId = `dco-upload-${format.value}`;

  const statusBadge = {
    empty: { variant: "neutral", label: "En attente" },
    invalid: { variant: "warning", label: "Fichier invalide" },
    ready: { variant: "success", label: "Prêt à enregistrer" },
    uploaded: { variant: "success", label: "Enregistré" },
  }[asset.status];

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{format.label}</p>
            <p className="text-xs text-slate-400">{format.description}</p>
          </div>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>

      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
          asset.status === "ready" || asset.status === "uploaded"
            ? "border-primary-300 bg-primary-50/50"
            : asset.status === "invalid"
              ? "border-rose-300 bg-rose-50/40"
              : "border-slate-200 bg-lavender-50 hover:border-primary-300 hover:bg-primary-50/40",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => onFileChange(format.value, e.target.files?.[0] ?? null)}
        />
        {asset.file ? (
          <>
            <FileImage className="h-5 w-5 text-primary-600" />
            <p className="max-w-full truncate text-xs font-medium text-slate-700">
              {asset.file.name}
            </p>
            <p className="text-[11px] text-slate-400">
              Cliquez pour choisir un autre fichier
            </p>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-slate-400" />
            <p className="text-xs font-medium text-slate-600">
              Cliquez pour choisir une image
            </p>
            <p className="text-[11px] text-slate-400">{ACCEPTED_EXTENSIONS_LABEL}</p>
          </>
        )}
      </label>

      {asset.error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {asset.error}
        </div>
      )}

      {asset.previewUrl && (
        <div className="mt-3 grid h-32 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <img
            src={asset.previewUrl}
            alt={`Aperçu — ${format.label}`}
            className="max-h-32 max-w-full object-contain"
          />
        </div>
      )}
    </Card>
  );
}

/**
 * One generated variant: a format's visual combined with a single store's
 * dynamic fields (name, city, address, opening_hours, store_url).
 */
function VariantCard({ variant }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid h-32 place-items-center border-b border-slate-100 bg-slate-50">
        <img
          src={variant.previewUrl}
          alt={`${variant.formatLabel} — ${variant.store.name}`}
          className="max-h-32 max-w-full object-contain"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="primary">{variant.formatLabel}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            {variant.store.city || "—"}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-slate-900">
          {variant.store.name}
        </p>
        <div className="mt-2 space-y-1 text-xs text-slate-500">
          {variant.store.address && (
            <p className="truncate">{variant.store.address}</p>
          )}
          {variant.store.opening_hours && (
            <p className="flex items-center gap-1 truncate">
              <Clock className="h-3 w-3 shrink-0" />
              {variant.store.opening_hours}
            </p>
          )}
          {variant.store.store_url && (
            <a
              href={variant.store.store_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 truncate text-primary-700 hover:underline"
            >
              <Link2 className="h-3 w-3 shrink-0" />
              {variant.store.store_url}
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function DCO() {
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [advertiserId, setAdvertiserId] = useState("");
  const [advertiserStores, setAdvertiserStores] = useState([]);
  const [assets, setAssets] = useState({
    banner: { ...EMPTY_ASSET },
    rectangle: { ...EMPTY_ASSET },
    interstitial: { ...EMPTY_ASSET },
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  // Jour 2 — generated variants (format × store) and the "compare 2 stores" picker.
  const [variants, setVariants] = useState([]);
  const [variantNotice, setVariantNotice] = useState(null);
  const [compareStoreIdA, setCompareStoreIdA] = useState("");
  const [compareStoreIdB, setCompareStoreIdB] = useState("");

  const assetsRef = useRef(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  // Load the advertiser list + format catalog (shared with the campaign wizard).
  useEffect(() => {
    let active = true;
    getCampaignOptions().then((opts) => {
      if (!active) return;
      setOptions(opts);
      setAdvertiserId((current) => current || String(opts.advertisers[0]?.value ?? ""));
    });
    return () => {
      active = false;
    };
  }, []);

  // Pre-fill the "champs dynamiques client" from the client store DB, once an
  // advertiser is known — and keep the full store list (not just the first
  // match) so the Jour 2 variant generation can use every store available.
  useEffect(() => {
    if (!advertiserId) return undefined;
    let active = true;
    apiGet("/stores")
      .then((stores) => {
        if (!active) return;
        const matches = stores.filter(
          (store) => String(store.advertiser_id) === String(advertiserId),
        );
        setAdvertiserStores(matches);
      })
      .catch(() => {
        if (active) setAdvertiserStores([]);
      });
    return () => {
      active = false;
    };
  }, [advertiserId]);

  const dynamicStore = advertiserStores[0] ?? GENERIC_EXAMPLE_STORE;

  /**
   * Switching advertiser resets the uploaded visuals and any generated
   * variants — both are scoped to one advertiser, so nothing saved for the
   * previous one should silently carry over and get mixed with the new
   * advertiser's stores.
   */
  const handleAdvertiserChange = (value) => {
    setAdvertiserId(value);
    setAssets((prev) => {
      Object.values(prev).forEach((asset) => {
        if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
      });
      return {
        banner: { ...EMPTY_ASSET },
        rectangle: { ...EMPTY_ASSET },
        interstitial: { ...EMPTY_ASSET },
      };
    });
    setNotice(null);
    setVariants([]);
    setVariantNotice(null);
    setCompareStoreIdA("");
    setCompareStoreIdB("");
  };

  // Revoke every remaining object URL when the page unmounts.
  useEffect(() => {
    return () => {
      Object.values(assetsRef.current).forEach((asset) => {
        if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
      });
    };
  }, []);

  const handleFileChange = (formatValue, file) => {
    setNotice(null);
    setAssets((prev) => {
      const previous = prev[formatValue];
      if (previous.previewUrl) URL.revokeObjectURL(previous.previewUrl);

      if (!file) {
        return { ...prev, [formatValue]: { ...EMPTY_ASSET } };
      }
      if (!isAcceptedImage(file)) {
        return {
          ...prev,
          [formatValue]: {
            file: null,
            previewUrl: null,
            error: `Format non supporté. Utilisez : ${ACCEPTED_EXTENSIONS_LABEL}.`,
            status: "invalid",
          },
        };
      }
      return {
        ...prev,
        [formatValue]: {
          file,
          previewUrl: URL.createObjectURL(file),
          error: null,
          status: "ready",
        },
      };
    });
    // Any variant generated from this format used the previous blob preview,
    // which is about to be revoked/replaced — drop it so the gallery never
    // shows a broken image.
    setVariants((prev) => prev.filter((variant) => variant.formatValue !== formatValue));
  };

  const readyFormats = useMemo(
    () => Object.entries(assets).filter(([, asset]) => asset.status === "ready"),
    [assets],
  );
  const hasNoVisual = readyFormats.length === 0;

  const handleSubmit = async () => {
    if (hasNoVisual || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await Promise.all(
        readyFormats.map(([formatValue, asset]) =>
          uploadCreative({ file: asset.file, format: formatValue, advertiserId }),
        ),
      );
      setAssets((prev) => {
        const next = { ...prev };
        readyFormats.forEach(([formatValue]) => {
          next[formatValue] = { ...next[formatValue], status: "uploaded" };
        });
        return next;
      });
      setNotice({
        type: "success",
        message: `${readyFormats.length} visuel${readyFormats.length > 1 ? "s" : ""} enregistré${readyFormats.length > 1 ? "s" : ""} avec succès.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message || "Échec de l'enregistrement des visuels.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const dynamicFields = [
    { label: "Nom du magasin", value: dynamicStore.name },
    { label: "Ville", value: dynamicStore.city },
    { label: "Adresse", value: dynamicStore.address },
    { label: "Horaires", value: dynamicStore.opening_hours },
    { label: "URL du magasin", value: dynamicStore.store_url },
  ];

  /* --------------------- Jour 2 — variant generation --------------------- */

  // Visuals actually saved (not just locally "ready") — each still holds its
  // local blob preview, which is the only real image data available (no file
  // is ever persisted server-side, see dco_service.py).
  const uploadedAssets = useMemo(
    () => Object.entries(assets).filter(([, asset]) => asset.status === "uploaded"),
    [assets],
  );

  const canGenerate = uploadedAssets.length > 0 && advertiserStores.length > 0;
  const variantCountPreview = uploadedAssets.length * advertiserStores.length;

  const generateHint = (() => {
    if (uploadedAssets.length === 0) {
      return "Enregistrez au moins un visuel ci-dessus avant de générer les variantes.";
    }
    if (advertiserStores.length === 0) {
      return "Aucun magasin disponible pour cet annonceur — importez des magasins avant de générer les variantes.";
    }
    return `${uploadedAssets.length} visuel${uploadedAssets.length > 1 ? "s" : ""} × ${advertiserStores.length} magasin${advertiserStores.length > 1 ? "s" : ""} = ${variantCountPreview} variante${variantCountPreview > 1 ? "s" : ""} seront générées.`;
  })();

  const handleGenerateVariants = () => {
    if (!canGenerate) return;
    const generated = [];
    uploadedAssets.forEach(([formatValue, asset]) => {
      const format = options.formats.find((f) => f.value === formatValue);
      advertiserStores.forEach((store) => {
        generated.push({
          id: `${formatValue}-${store.id}`,
          formatValue,
          formatLabel: format?.label ?? formatValue,
          previewUrl: asset.previewUrl,
          store,
        });
      });
    });
    setVariants(generated);

    const uniqueStores = [...new Map(generated.map((v) => [v.store.id, v.store])).values()];
    setCompareStoreIdA(uniqueStores[0] ? String(uniqueStores[0].id) : "");
    setCompareStoreIdB(
      uniqueStores[1] ? String(uniqueStores[1].id) : uniqueStores[0] ? String(uniqueStores[0].id) : "",
    );

    setVariantNotice({
      type: "success",
      message: `${generated.length} variante${generated.length > 1 ? "s" : ""} générée${generated.length > 1 ? "s" : ""} avec succès.`,
    });
  };

  const uniqueVariantStores = useMemo(
    () => [...new Map(variants.map((v) => [v.store.id, v.store])).values()],
    [variants],
  );
  const storeCompareOptions = uniqueVariantStores.map((store) => ({
    value: String(store.id),
    label: `${store.name} · ${store.city}`,
  }));
  const variantsForStore = (storeId) =>
    variants.filter((variant) => String(variant.store.id) === String(storeId));

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Créations / DCO" }]}
        title="Créations / DCO"
        subtitle="Uploadez les visuels publicitaires et préparez les variantes dynamiques par magasin"
      />

      {/* Advertiser + dynamic client fields */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Annonceur & champs dynamiques client
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Sélectionnez l'annonceur pour lequel préparer les créatives.
            </p>
          </div>
          <Select
            label="Annonceur"
            value={advertiserId}
            onChange={(e) => handleAdvertiserChange(e.target.value)}
            options={options.advertisers}
            className="w-48"
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-50 text-primary-600">
              <Info className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-slate-800">
              Champs dynamiques client
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dynamicFields.map((field) => (
              <Field key={field.label} label={field.label}>
                <Input value={field.value ?? "—"} disabled readOnly />
              </Field>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Ces champs (issus de la base magasins importée) seront utilisés
            pour générer automatiquement les variantes de créative par
            magasin (nom, ville, adresse, horaires, lien).
          </p>
        </div>
      </Card>

      {/* Upload zones */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Visuels publicitaires
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {options.formats.map((format) => (
            <FormatUploadCard
              key={format.value}
              format={format}
              asset={assets[format.value] ?? EMPTY_ASSET}
              onFileChange={handleFileChange}
            />
          ))}
        </div>
      </div>

      {/* Global validation / save */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">
              Enregistrer les visuels de cette campagne
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {hasNoVisual
                ? "Ajoutez au moins un visuel (bannière, pavé ou interstitiel) avant d'enregistrer."
                : `${readyFormats.length} visuel${readyFormats.length > 1 ? "s" : ""} prêt${readyFormats.length > 1 ? "s" : ""} à être enregistré${readyFormats.length > 1 ? "s" : ""}.`}
            </p>
          </div>
          <Button onClick={handleSubmit} disabled={hasNoVisual || submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Enregistrer les créatives
          </Button>
        </div>

        {notice && (
          <div
            className={cn(
              "mt-4 rounded-lg px-4 py-3 text-sm",
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {notice.message}
          </div>
        )}
      </Card>

      {/* Jour 2 — automatic variant generation */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">
              Génération automatique des variantes
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{generateHint}</p>
          </div>
          <Button onClick={handleGenerateVariants} disabled={!canGenerate}>
            <Sparkles className="h-4 w-4" />
            Générer toutes les variantes
          </Button>
        </div>

        {variantNotice && (
          <div
            className={cn(
              "mt-4 rounded-lg px-4 py-3 text-sm",
              variantNotice.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {variantNotice.message}
          </div>
        )}
      </Card>

      {/* Side-by-side comparison of 2 stores */}
      {variants.length > 0 && (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Comparaison par magasin
            </h2>
            <p className="text-sm text-slate-400">
              Comparez le rendu des créatives générées entre deux magasins
              différents.
            </p>
          </div>

          {uniqueVariantStores.length < 2 ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              La comparaison nécessite au moins 2 magasins pour cet annonceur.
              Un seul magasin est disponible actuellement.
            </p>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Select
                  label="Magasin A"
                  value={compareStoreIdA}
                  onChange={(e) => setCompareStoreIdA(e.target.value)}
                  options={storeCompareOptions}
                />
                <Select
                  label="Magasin B"
                  value={compareStoreIdB}
                  onChange={(e) => setCompareStoreIdB(e.target.value)}
                  options={storeCompareOptions}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[compareStoreIdA, compareStoreIdB].map((storeId, index) => (
                  <div key={`${storeId}-${index}`}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {variantsForStore(storeId).map((variant) => (
                        <VariantCard key={variant.id} variant={variant} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Full gallery of generated variants */}
      {variants.length > 0 && (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Galerie des variantes ({variants.length})
            </h2>
            <p className="text-sm text-slate-400">
              Toutes les combinaisons visuel × magasin générées pour cet
              annonceur.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {variants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
