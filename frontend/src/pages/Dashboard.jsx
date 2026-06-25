import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import PerformanceChart from "../components/charts/PerformanceChart";
import { chartColors } from "../styles/theme";
import {
  kpis,
  recentCampaigns,
  statusVariants,
  statusFilterOptions,
  periodFilterOptions,
} from "../data/mockData";
import { cn } from "../lib/cn";

/* Single KPI tile. */
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

/* Legend chip for the performance chart. */
function LegendChip({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const tableHeadings = [
  { label: "Campagne", align: "left" },
  { label: "Statut", align: "left" },
  { label: "Période", align: "left" },
  { label: "Budget", align: "right" },
  { label: "Dépensé", align: "right" },
  { label: "Impressions", align: "right" },
  { label: "Clics", align: "right" },
];

export default function Dashboard() {
  const [status, setStatus] = useState(statusFilterOptions[0]);
  const [period, setPeriod] = useState(periodFilterOptions[1]); // 30 derniers jours

  const filteredCampaigns = useMemo(() => {
    if (status === statusFilterOptions[0]) return recentCampaigns;
    return recentCampaigns.filter((campaign) => campaign.status === status);
  }, [status]);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Dashboard" }]}
        title="Dashboard d'accueil"
        subtitle="Vue d'ensemble des campagnes drive-to-store"
        actions={
          <>
            <Select
              label="Statut"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusFilterOptions}
              className="w-44"
            />
            <Select
              label="Période"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={periodFilterOptions}
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

      {/* Performance chart */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Performance des campagnes
            </h2>
            <p className="text-sm text-slate-400">
              Impressions et clics sur la période sélectionnée
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LegendChip color={chartColors.impressions} label="Impressions" />
            <LegendChip color={chartColors.clics} label="Clics" />
          </div>
        </div>
        <PerformanceChart />
      </Card>

      {/* Recent campaigns */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Campagnes récentes
            </h2>
            <p className="text-sm text-slate-400">
              Les dernières campagnes drive-to-store
            </p>
          </div>
          <Link
            to="/reporting"
            className="text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 active:text-primary-900"
          >
            Voir tout
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                {tableHeadings.map((heading) => (
                  <th
                    key={heading.label}
                    className={cn(
                      "px-5 py-3 font-medium",
                      heading.align === "right" && "text-right",
                    )}
                  >
                    {heading.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeadings.length}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    Aucune campagne ne correspond à ce filtre.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition-colors hover:bg-lavender-50"
                  >
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {campaign.name}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariants[campaign.status]} dot>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{campaign.period}</td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {campaign.budget}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {campaign.spent}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {campaign.impressions}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {campaign.clics}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
