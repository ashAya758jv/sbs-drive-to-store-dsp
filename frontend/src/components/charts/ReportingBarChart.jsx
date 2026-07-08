import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { chartColors } from "../../styles/theme";

/** 1_245_000 → "1,2M", 820_000 → "820k". */
function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-200/60">
      <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize text-slate-600">{entry.name}</span>
          <span className="ml-auto font-medium text-slate-900">
            {entry.value.toLocaleString("fr-FR")}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Grouped bar chart comparing impressions/clics across categories — either
 * campaigns (default view) or cities (when a single campaign is selected in
 * the page filter, see Reporting.jsx).
 */
export default function ReportingBarChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartColors.axis }}
            dy={8}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartColors.axis }}
            tickFormatter={formatCompact}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: chartColors.grid }} />
          <Bar
            dataKey="impressions"
            name="Impressions"
            fill={chartColors.impressions}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="clicks"
            name="Clics"
            fill={chartColors.clics}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
