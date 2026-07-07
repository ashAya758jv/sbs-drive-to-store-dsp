import { BarChart3, Gamepad2 } from "lucide-react";
import Checkbox from "../ui/Checkbox";
import Toggle from "../ui/Toggle";
import Badge from "../ui/Badge";
import { labelOf, labelsOf, toggleValue } from "./helpers";

/** Number formatted the French way (thin spaces as thousands separators). */
function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value || 0);
}

/** One line of the final recap. */
function SummaryRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-700 sm:max-w-[65%] sm:text-right">
        {children}
      </span>
    </div>
  );
}

/**
 * Step 4 — app categories, "exclude games" toggle, live estimated-impressions
 * counter and the final campaign summary.
 */
export default function StepCategories({
  form,
  update,
  errors,
  options,
  estimated,
  selectedStores = [],
}) {
  const advertiserLabel = form.advertiser_id
    ? labelOf(options.advertisers, form.advertiser_id)
    : "—";
  const period =
    form.start_date && form.end_date
      ? `${form.start_date} → ${form.end_date}`
      : "—";
  const chips = (values, opts) => {
    const labels = labelsOf(opts, values);
    return labels.length ? (
      <span className="flex flex-wrap justify-end gap-1.5">
        {labels.map((label) => (
          <Badge key={label} variant="primary">
            {label}
          </Badge>
        ))}
      </span>
    ) : (
      "—"
    );
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-700">
            Catégories d'applications
            <span className="ml-0.5 text-rose-500">*</span>
          </p>
          {errors.app_categories && (
            <span className="text-xs font-medium text-rose-600">
              {errors.app_categories}
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {options.app_categories.map((cat) => (
            <Checkbox
              key={cat.value}
              label={cat.label}
              checked={form.app_categories.includes(cat.value)}
              onChange={() =>
                update({
                  app_categories: toggleValue(form.app_categories, cat.value),
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Exclude games */}
      <Toggle
        checked={form.exclude_games}
        onChange={(value) => update({ exclude_games: value })}
        label="Exclure les jeux"
        description="Retire les applications de la catégorie Jeux de la diffusion (activé par défaut)."
      />

      {/* Estimated impressions */}
      <div className="flex items-center gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-600 text-white">
          <BarChart3 className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
            Impressions estimées
          </p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatNumber(estimated)}
          </p>
          <p className="text-xs text-slate-500">
            Estimation indicative basée sur le budget et le ciblage.
          </p>
        </div>
      </div>

      {/* Final summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Résumé de la campagne
        </h3>
        <div className="divide-y divide-slate-100">
          <SummaryRow label="Nom">{form.name || "—"}</SummaryRow>
          <SummaryRow label="Annonceur">{advertiserLabel}</SummaryRow>
          <SummaryRow label="Objectif">
            {form.objective ? labelOf(options.objectives, form.objective) : "—"}
          </SummaryRow>
          <SummaryRow label="Période">{period}</SummaryRow>
          <SummaryRow label="Budget total">
            {form.total_budget ? `${formatNumber(Number(form.total_budget))} MAD` : "—"}
          </SummaryRow>
          <SummaryRow label="Budget quotidien">
            {form.daily_budget ? `${formatNumber(Number(form.daily_budget))} MAD` : "—"}
          </SummaryRow>
          <SummaryRow label="Appareils">{chips(form.devices, options.devices)}</SummaryRow>
          <SummaryRow label="Systèmes">
            {chips(form.operating_systems, options.operating_systems)}
          </SummaryRow>
          <SummaryRow label="Plages horaires">
            {chips(form.time_ranges, options.time_ranges)}
          </SummaryRow>
          <SummaryRow label="Formats">{chips(form.formats, options.formats)}</SummaryRow>
          <SummaryRow label="Catégories">
            {chips(form.app_categories, options.app_categories)}
          </SummaryRow>
          <SummaryRow label="Jeux">
            <span className="inline-flex items-center gap-1.5">
              <Gamepad2 className="h-3.5 w-3.5 text-slate-400" />
              {form.exclude_games ? "Exclus" : "Inclus"}
            </span>
          </SummaryRow>
          <SummaryRow label={`Magasins ciblés (${selectedStores.length})`}>
            {selectedStores.length === 0 ? (
              "Aucun"
            ) : (
              <span className="flex flex-col gap-1 sm:items-end">
                {selectedStores.map((store) => (
                  <span key={store.store_id} className="text-sm text-slate-700">
                    {store.name}
                    {store.city ? ` · ${store.city}` : ""}
                    <span className="text-slate-400"> — {store.radius_km} km</span>
                  </span>
                ))}
              </span>
            )}
          </SummaryRow>
        </div>
      </div>
    </div>
  );
}
