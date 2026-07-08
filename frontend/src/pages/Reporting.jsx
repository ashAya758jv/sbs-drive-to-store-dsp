import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Lightbulb,
  MousePointerClick,
  Percent,
  Wallet,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import ReportingTrendChart from "../components/charts/ReportingTrendChart";
import ReportingBarChart from "../components/charts/ReportingBarChart";
import { chartColors } from "../styles/theme";
import { apiGet } from "../lib/api";
import {
  DAILY_ROWS,
  FALLBACK_CITIES,
  PERIOD_OPTIONS,
  REPORTING_CAMPAIGNS,
  filterRows,
  getPeriodRange,
  groupByKey,
  sumRows,
  toDailySeries,
} from "../data/reportingData";
import { cn } from "../lib/cn";

/** 1_245_000 → "1,2M", 820_000 → "820k". */
function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

/** Percentage change vs. the previous comparable period. */
function computeDelta(current, previous) {
  if (previous <= 0) {
    return { pct: current > 0 ? 100 : 0, delta: current > 0 ? "+100%" : "0%", trend: "up" };
  }
  const pct = ((current - previous) / previous) * 100;
  const trend = pct >= 0 ? "up" : "down";
  const sign = pct >= 0 ? "+" : "";
  return { pct, delta: `${sign}${pct.toFixed(1).replace(".", ",")}%`, trend };
}

/* Single KPI tile — same visual language as the Dashboard's, kept local to
   this page so the Dashboard component is never touched. */
function KpiCard({ label, value, delta, trend, icon: Icon }) {
  const isUp = trend === "up";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
            isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
          )}
        >
          {isUp ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {delta}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}

/* Legend chip for the trend chart. */
function LegendChip({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export default function Reporting() {
  const [period, setPeriod] = useState("30d");
  const [campaignId, setCampaignId] = useState("all");
  const [city, setCity] = useState("all");
  const [cities, setCities] = useState(FALLBACK_CITIES);

  // Cities come from the client store DB already imported in /magasins — reuse
  // the existing endpoint (read-only), with a graceful fallback if it's offline.
  useEffect(() => {
    let active = true;
    apiGet("/stores")
      .then((stores) => {
        if (!active) return;
        const unique = [...new Set(stores.map((store) => store.city).filter(Boolean))].sort(
          (a, b) => a.localeCompare(b),
        );
        if (unique.length > 0) setCities(unique);
      })
      .catch(() => {
        /* keep FALLBACK_CITIES */
      });
    return () => {
      active = false;
    };
  }, []);

  const cityOptions = useMemo(
    () => [
      { value: "all", label: "Toutes les villes" },
      ...cities.map((c) => ({ value: c, label: c })),
    ],
    [cities],
  );

  const { filteredRows, previousRows } = useMemo(() => {
    const range = getPeriodRange(period);
    return {
      filteredRows: filterRows(DAILY_ROWS, {
        start: range.start,
        end: range.end,
        campaignId,
        city,
      }),
      previousRows: filterRows(DAILY_ROWS, {
        start: range.prevStart,
        end: range.prevEnd,
        campaignId,
        city,
      }),
    };
  }, [period, campaignId, city]);

  const totals = useMemo(() => sumRows(filteredRows), [filteredRows]);
  const previousTotals = useMemo(() => sumRows(previousRows), [previousRows]);
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const previousCtr =
    previousTotals.impressions > 0 ? (previousTotals.clicks / previousTotals.impressions) * 100 : 0;

  const impressionsDelta = computeDelta(totals.impressions, previousTotals.impressions);
  const clicksDelta = computeDelta(totals.clicks, previousTotals.clicks);
  const ctrDelta = computeDelta(ctr, previousCtr);
  const spendDelta = computeDelta(totals.spend, previousTotals.spend);

  const kpis = [
    {
      id: "impressions",
      label: "Impressions",
      value: formatCompact(totals.impressions),
      icon: Eye,
      ...impressionsDelta,
    },
    {
      id: "clics",
      label: "Clics",
      value: totals.clicks.toLocaleString("fr-FR"),
      icon: MousePointerClick,
      ...clicksDelta,
    },
    {
      id: "ctr",
      label: "CTR",
      value: `${ctr.toFixed(2).replace(".", ",")}%`,
      icon: Percent,
      ...ctrDelta,
    },
    {
      id: "budget",
      label: "Budget dépensé",
      value: `${Math.round(totals.spend).toLocaleString("fr-FR")} MAD`,
      icon: Wallet,
      ...spendDelta,
    },
  ];

  const dailySeries = useMemo(() => toDailySeries(filteredRows), [filteredRows]);

  // When a single campaign is selected, comparing it against itself makes no
  // sense — switch the bar chart to compare its stores/cities instead.
  const barMode = campaignId === "all" ? "campaign" : "city";
  const barData = useMemo(() => {
    const groups = groupByKey(filteredRows, barMode === "campaign" ? "campaignLabel" : "city");
    return groups.map((g) => ({ label: g.label, impressions: g.impressions, clicks: g.clicks }));
  }, [filteredRows, barMode]);

  const topCampaign = useMemo(
    () => groupByKey(filteredRows, "campaignLabel")[0] ?? null,
    [filteredRows],
  );
  const topCity = useMemo(() => groupByKey(filteredRows, "city")[0] ?? null, [filteredRows]);

  const insights = useMemo(() => {
    if (totals.impressions === 0) {
      return ["Aucune donnée sur la période et les filtres sélectionnés."];
    }
    const list = [
      `Les impressions ${impressionsDelta.trend === "up" ? "ont augmenté" : "ont diminué"} de ${Math.abs(impressionsDelta.pct).toFixed(1).replace(".", ",")}% par rapport à la période précédente.`,
      `Le CTR moyen sur la période est de ${ctr.toFixed(2).replace(".", ",")}%, pour un budget dépensé de ${Math.round(totals.spend).toLocaleString("fr-FR")} MAD.`,
    ];
    if (topCampaign && campaignId === "all") {
      list.push(
        `La campagne la plus performante est « ${topCampaign.label} » avec ${topCampaign.impressions.toLocaleString("fr-FR")} impressions.`,
      );
    }
    if (topCity) {
      list.push(
        `${topCity.label} génère le plus de clics sur la période (${topCity.clicks.toLocaleString("fr-FR")}).`,
      );
    }
    return list;
  }, [totals, impressionsDelta, ctr, topCampaign, topCity, campaignId]);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Reporting" }]}
        title="Reporting"
        subtitle="Analysez les performances de vos campagnes drive-to-store"
        actions={
          <>
            <Select
              label="Période"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={PERIOD_OPTIONS}
              className="w-44"
            />
            <Select
              label="Campagne"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              options={REPORTING_CAMPAIGNS}
              className="w-56"
            />
            <Select
              label="Ville / magasin"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={cityOptions}
              className="w-44"
            />
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </div>

      {/* Daily trend */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Évolution quotidienne
            </h2>
            <p className="text-sm text-slate-400">
              Impressions et clics jour par jour sur la période sélectionnée
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LegendChip color={chartColors.impressions} label="Impressions" />
            <LegendChip color={chartColors.clics} label="Clics" />
          </div>
        </div>
        <ReportingTrendChart data={dailySeries} />
      </Card>

      {/* Comparison bar chart */}
      <Card className="mt-6 p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            {barMode === "campaign"
              ? "Performance par campagne"
              : "Performance par ville / magasin"}
          </h2>
          <p className="text-sm text-slate-400">
            {barMode === "campaign"
              ? "Comparaison des impressions et des clics entre campagnes"
              : "Comparaison des impressions et des clics entre les villes de cette campagne"}
          </p>
        </div>
        {barData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Aucune donnée à afficher pour ce filtre.
          </p>
        ) : (
          <ReportingBarChart data={barData} />
        )}
      </Card>

      {/* Textual synthesis */}
      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Principaux enseignements
            </h2>
            <p className="text-sm text-slate-400">
              Synthèse automatique basée sur la période et les filtres actifs
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {insights.map((insight) => (
            <li key={insight} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              {insight}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
