import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Info,
  Loader2,
  Maximize2,
  RectangleHorizontal,
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

export default function DCO() {
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [advertiserId, setAdvertiserId] = useState("");
  const [dynamicStore, setDynamicStore] = useState(GENERIC_EXAMPLE_STORE);
  const [assets, setAssets] = useState({
    banner: { ...EMPTY_ASSET },
    rectangle: { ...EMPTY_ASSET },
    interstitial: { ...EMPTY_ASSET },
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

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
  // advertiser is known. Falls back to a generic example if unavailable.
  useEffect(() => {
    if (!advertiserId) return undefined;
    let active = true;
    apiGet("/stores")
      .then((stores) => {
        if (!active) return;
        const match = stores.find(
          (store) => String(store.advertiser_id) === String(advertiserId),
        );
        setDynamicStore(match ?? GENERIC_EXAMPLE_STORE);
      })
      .catch(() => {
        if (active) setDynamicStore(GENERIC_EXAMPLE_STORE);
      });
    return () => {
      active = false;
    };
  }, [advertiserId]);

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
            onChange={(e) => setAdvertiserId(e.target.value)}
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
    </>
  );
}
